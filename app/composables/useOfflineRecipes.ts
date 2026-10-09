import type { RecipePageResponse, RecipeWeb } from '../../types/recipe'

const storageKey = (userId: string | undefined) => `recipe-book:offline:${userId || 'public'}`

export const useOfflineRecipes = () => {
  const { user } = useUserSession()
  const recipes = useLocalStorage<RecipeWeb[]>(storageKey(user.value?.id), [])
  const online = useOnline()

  const items = computed(() => import.meta.client && !online.value ? recipes.value : [])
  const save = (value: RecipeWeb[]) => {
    if (import.meta.client) recipes.value = value
  }
  const savePage = (page: RecipePageResponse) => {
    if (!import.meta.client) return
    const byId = new Map(recipes.value.map(recipe => [recipe.id, recipe]))
    page.items.forEach(recipe => byId.set(recipe.id, recipe))
    save([...byId.values()])
  }
  const clear = () => {
    if (import.meta.client) recipes.value = []
  }

  return {
    items,
    save,
    savePage,
    clear,
    isOffline: computed(() => import.meta.client && !online.value)
  }
}
