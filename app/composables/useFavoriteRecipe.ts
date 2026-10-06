import { useQueryCache } from '@pinia/colada'
import { recipeKeys } from '~/queries/recipes'
import { updateFavoriteIds } from '~/utils/favorites'

export const useFavoriteRecipe = () => {
  const favorites = useState<string[]>('recipe-favorites', () => [])
  const loadedForUser = useState<string | null>('recipe-favorites-user', () => null)
  const isLoading = useState<boolean>('recipe-favorites-loading', () => false)
  const favoriteIds = computed(() => new Set(favorites.value))
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
      await using _ = await useToaster().apiError(error)
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
    const previous = favorites.value
    const shouldFavorite = !hasFavorite(id)
    favorites.value = updateFavoriteIds(previous, id, shouldFavorite)
    loadedForUser.value = user.value.id

    try {
      const ids = await requestFetch<string[]>('/api/user/favorites', {
        method: 'PUT',
        body: { recipeId: id, favorite: shouldFavorite }
      })
      if (user.value?.id === userId) {
        favorites.value = [...new Set(ids)]
        loadedForUser.value = userId
        await queryCache.invalidateQueries({ key: recipeKeys.root })
      }
    } catch (error) {
      if (user.value?.id === userId) favorites.value = previous
      await using _ = await useToaster().apiError(error)
    }
  }

  watch([loggedIn, () => user.value?.id], () => refreshFavorites(true), { immediate: true })

  return {
    favorites: readonly(favorites),
    hasFavorite,
    refreshFavorites,
    toggleFavorite
  }
}
