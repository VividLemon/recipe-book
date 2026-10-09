import type { RecipePageResponse, RecipeWeb } from '../../types/recipe'
import { useIndexedDB } from '~/composables/useIndexedDB'

const scopeKey = (userId: string | undefined) => userId || 'public'
const imageKey = (scope: string, url: string) => `${scope}:${url}`

const imageUrls = (recipe: RecipeWeb) => [
  ...(recipe.photos?.coverImage ? Object.values(recipe.photos.coverImage).flatMap(Object.values) : []),
  ...(recipe.photos?.stepsImages || [])
]

export const useOfflineRecipes = () => {
  const { user } = useUserSession()
  const online = useOnline()
  const scope = computed(() => scopeKey(user.value?.id))
  const storage = useIndexedDB<RecipeWeb[]>(scope.value, [])
  const recipes = shallowRef<RecipeWeb[]>([])
  let objectUrls: string[] = []

  const revokeObjectUrls = () => {
    objectUrls.forEach(url => URL.revokeObjectURL(url))
    objectUrls = []
  }

  const load = async () => {
    if (!import.meta.client || online.value) return
    revokeObjectUrls()
    const stored = (await storage.value).value
    const restored = await Promise.all(stored.map(async recipe => {
      const urls = await Promise.all(imageUrls(recipe).map(async url => {
        const blob = await storage.getImage(imageKey(scope.value, url))
        return blob ? URL.createObjectURL(blob) : url
      }))
      let index = 0
      const nextUrl = () => urls[index++] || ''
      return {
        ...recipe,
        photos: recipe.photos && {
          ...recipe.photos,
          coverImage: recipe.photos.coverImage && {
            default: { original: nextUrl(), webp: nextUrl(), avif: nextUrl() },
            thumbnail: { original: nextUrl(), webp: nextUrl(), avif: nextUrl() }
          },
          stepsImages: recipe.photos.stepsImages?.map(nextUrl)
        }
      }
    }))
    objectUrls = restored.flatMap(imageUrls).filter(url => url.startsWith('blob:'))
    recipes.value = restored
  }

  const savePage = async (page: RecipePageResponse) => {
    if (!import.meta.client) return
    const existing = (await storage.value).value
    const byId = new Map(existing.map(recipe => [recipe.id, recipe]))
    page.items.forEach(recipe => byId.set(recipe.id, recipe))
    storage.value.value = [...byId.values()]
    await Promise.all(page.items.flatMap(imageUrls).map(async url => {
      try {
        const response = await fetch(url)
        if (response.ok) await storage.putImage(imageKey(scope.value, url), await response.blob())
      } catch { /* best effort image caching */ }
    }))
    if (!online.value) await load()
  }

  const clear = async () => {
    const stored = (await storage.value).value
    await Promise.all(stored.flatMap(imageUrls).map(url => storage.removeImage(imageKey(scope.value, url))))
    storage.value.value = []
    storage.close()
    revokeObjectUrls()
    recipes.value = []
  }

  watch([() => user.value?.id, online], () => {
    if (online.value) {
      storage.close()
      return
    }
    void load()
  }, { immediate: true })

  return {
    items: computed(() => import.meta.client && !online.value ? recipes.value : []),
    savePage,
    clear,
    isOffline: computed(() => import.meta.client && !online.value)
  }
}
