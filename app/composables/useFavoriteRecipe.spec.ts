import { describe, expect, it } from 'vitest'
import { updateFavoriteIds } from '../utils/favorites'

describe('favorite recipe updates', () => {
  it('adds and removes favorites without duplicates', () => {
    expect(updateFavoriteIds([], 'recipe-1', true)).toEqual(['recipe-1'])
    expect(updateFavoriteIds(['recipe-1'], 'recipe-1', true)).toEqual(['recipe-1'])
    expect(updateFavoriteIds(['recipe-1', 'recipe-2'], 'recipe-1', false)).toEqual(['recipe-2'])
  })
})
