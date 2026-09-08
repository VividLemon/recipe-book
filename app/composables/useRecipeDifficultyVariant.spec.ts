import { describe, expect, it } from 'vitest'
import { useRecipeDifficultyVariant } from './useRecipeDifficultyVariant'

describe('useRecipeDifficultyVariant', () => {
  it.each([
    ['Easy', 'success'],
    ['Medium', 'warning'],
    ['Hard', 'danger']
  ] as const)('maps %s to %s', (difficulty, variant) => {
    expect(useRecipeDifficultyVariant(difficulty).value).toBe(variant)
  })
})
