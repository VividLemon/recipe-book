import { describe, expect, it } from 'vitest'
import { useFormattedRecipe } from './useFormattedRecipe'

describe('useFormattedRecipe', () => {
  it('formats recipe durations without changing other fields', () => {
    const recipe = {
      id: '1',
      createdAt: 0,
      updatedAt: 0,
      name: 'Soup',
      ingredients: [],
      tags: [],
      steps: '',
      difficulty: 'Easy' as const,
      time: 65
    }
    expect(useFormattedRecipe([recipe]).value).toEqual([
      { ...recipe, time: '1 hour and 5 minutes' }
    ])
  })
})
