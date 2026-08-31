import {StorageSerializers} from "@vueuse/core";

export const useFavoriteRecipe = () => {
  const favorites = useLocalStorage<Set<string>>('favorite-recipes', new Set(), {
    initOnMounted: true,
    serializer: StorageSerializers.set
  })

  const hasFavorite = (id: string) => favorites.value.has(id)
  const toggleFavorite = (id: string) => {
    if (hasFavorite(id)) {
      favorites.value.delete(id)
    } else {
      favorites.value.add(id)
    }
  }

  return {
    favorites: readonly(favorites),
    hasFavorite,
    toggleFavorite
  }
}
