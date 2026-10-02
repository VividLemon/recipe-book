import { useQueryCache } from '@pinia/colada'
import { recipeKeys } from '~/queries/recipes'

export const useFavoriteRecipe = () => {
  const favorites = useState<string[]>('recipe-favorites', () => [])
  const loadedForUser = useState<string | null>('recipe-favorites-user', () => null)
  const { loggedIn, user } = useUserSession()
  const queryCache = useQueryCache()

  const hasFavorite = (id: string) => favorites.value.includes(id)

  const refreshFavorites = async (force = false) => {
    if (!loggedIn.value || !user.value) {
      favorites.value = []
      loadedForUser.value = null
      return
    }
    if (!force && loadedForUser.value === user.value.id) return
    favorites.value = await $fetch<string[]>('/api/user/favorites')
    loadedForUser.value = user.value.id
  }

  const toggleFavorite = async (id: string) => {
    if (!loggedIn.value || !user.value) {
      await navigateTo('/login')
      return
    }
    const previous = favorites.value
    const shouldFavorite = !hasFavorite(id)
    favorites.value = shouldFavorite
      ? [...previous, id]
      : previous.filter((favoriteId) => favoriteId !== id)
    loadedForUser.value = user.value.id

    try {
      favorites.value = await $fetch<string[]>('/api/user/favorites', {
        method: 'PUT',
        body: { recipeId: id, favorite: shouldFavorite }
      })
      await queryCache.invalidateQueries({ key: recipeKeys.root })
    } catch (error) {
      favorites.value = previous
      await using _ = await useToaster().apiError(error)
    }
  }

  watch(loggedIn, () => refreshFavorites(true))

  return {
    favorites: readonly(favorites),
    hasFavorite,
    refreshFavorites,
    toggleFavorite
  }
}
