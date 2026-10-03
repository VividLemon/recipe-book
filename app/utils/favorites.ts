export const updateFavoriteIds = (favorites: string[], id: string, favorite: boolean) => {
  const values = new Set(favorites)
  if (favorite) values.add(id)
  else values.delete(id)
  return [...values]
}
