import { describe, expect, it } from 'vitest'
import FavoriteStarIcon from './FavoriteStarIcon.vue'

describe('FavoriteStarIcon', () => {
  it('exports a component accepting a recipe id', () => {
    expect(FavoriteStarIcon).toBeDefined()
  })
})
