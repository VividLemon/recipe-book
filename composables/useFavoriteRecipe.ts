export const useFavoriteRecipe = () => {
  const favorites = useLocalStorage<string[]>('favorite-recipes', [], {
    initOnMounted: true
  })

  const isFavorite = (id: string) => favorites.value.includes(id)
  const toggleFavorite = (id: string) => {
    const index = favorites.value.indexOf(id)
    if (index === -1) {
      favorites.value.push(id)
    } else {
      favorites.value.splice(index, 1)
    }
  }

  return {
    favorites,
    isFavorite,
    toggleFavorite
  }
}
