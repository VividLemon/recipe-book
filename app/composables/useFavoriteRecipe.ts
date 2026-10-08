import { useQueryCache } from '@pinia/colada'
import { recipeKeys } from '~/queries/recipes'
import { updateFavoriteIds } from '~/utils/favorites'

let toggleQueue: Promise<unknown> = Promise.resolve()
let pendingToggles = 0

export const useFavoriteRecipe = () => {
  const toaster = useToaster()
  const favorites = useState<string[]>('recipe-favorites', () => [])
  const loadedForUser = useState<string | null>('recipe-favorites-user', () => null)
  const isLoading = useState<boolean>('recipe-favorites-loading', () => false)
  const favoriteIds = computed<ReadonlySet<string>>(() => new Set(favorites.value))
  const { loggedIn, user } = useUserSession()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  const hasFavorite = (id: string) => favoriteIds.value.has(id)

  const refreshFavorites = async (force = false) => {
    if (!loggedIn.value || !user.value) {
      favorites.value = []
      loadedForUser.value = null
      return
    }
    if (loadedForUser.value !== user.value.id) {
      favorites.value = []
      loadedForUser.value = null
    }
    if ((!force && loadedForUser.value === user.value.id) || isLoading.value) return
    const requestedUserId = user.value.id
    isLoading.value = true
    try {
      const ids = await requestFetch<string[]>('/api/user/favorites')
      if (loggedIn.value && user.value?.id === requestedUserId) {
        favorites.value = [...new Set(ids)]
        loadedForUser.value = requestedUserId
      }
    } catch (error) {
      await using _ = await toaster.apiError(error)
    } finally {
      isLoading.value = false
      if (loggedIn.value && user.value?.id !== requestedUserId) {
        void refreshFavorites(true)
      }
    }
  }

  const toggleFavorite = async (id: string) => {
    if (!loggedIn.value || !user.value) {
      await navigateTo('/login')
      return
    }
    const userId = user.value.id
    const shouldFavorite = !hasFavorite(id)
    favorites.value = updateFavoriteIds(favorites.value, id, shouldFavorite)
    loadedForUser.value = userId

    pendingToggles++
    const request = toggleQueue.then(async () => {
      try {
        const ids = await requestFetch<string[]>('/api/user/favorites', {
          method: 'PUT',
          body: { recipeId: id, favorite: shouldFavorite }
        })
        if (user.value?.id === userId) {
          if (pendingToggles === 1) {
            favorites.value = [...new Set(ids)]
            loadedForUser.value = userId
          }
          await queryCache.invalidateQueries({ key: recipeKeys.root })
        }
      } catch (error) {
        if (user.value?.id === userId) {
          favorites.value = updateFavoriteIds(favorites.value, id, !shouldFavorite)
        }
        await using _ = await toaster.apiError(error)
      } finally {
        pendingToggles--
      }
    })
    toggleQueue = request.catch(() => undefined)
    await request
  }

  watch([loggedIn, () => user.value?.id], () => refreshFavorites(true), { immediate: true })

  return {
    favoriteIds,
    hasFavorite,
    refreshFavorites,
    toggleFavorite
  }
}
