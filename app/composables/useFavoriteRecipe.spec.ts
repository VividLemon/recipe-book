import { describe, expect, it } from 'vitest'
import { useFavoriteRecipe } from './useFavoriteRecipe'

describe('useFavoriteRecipe', () => {
  it('toggles recipe ids in the favorites set', () => {
    const { hasFavorite, toggleFavorite } = useFavoriteRecipe()
    expect(hasFavorite('recipe-1')).toBe(false)
    toggleFavorite('recipe-1')
    expect(hasFavorite('recipe-1')).toBe(true)
    toggleFavorite('recipe-1')
    expect(hasFavorite('recipe-1')).toBe(false)
  })
})
