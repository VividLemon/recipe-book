import { describe, expect, it } from 'vitest'
import RecipesPage from './index.vue'

describe('recipes page', () => {
  it('exports the recipes page', () => {
    expect(RecipesPage).toBeDefined()
  })
})
