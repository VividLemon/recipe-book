import { describe, expect, it } from 'vitest'
import { recipeTagIdToRecipeTag, stringBooleanToBoolean } from './shared'

describe('shared utilities', () => {
  it('maps tag ids in the requested order and omits missing tags', () => {
    const tags = [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }]
    expect(recipeTagIdToRecipeTag(['b', 'missing', 'a'], tags)).toEqual([
      tags[1],
      tags[0]
    ])
  })

  it.each([
    ['true', true],
    ['false', false]
  ] as const)('converts %s to %s', (value, result) => {
    expect(stringBooleanToBoolean(value)).toBe(result)
  })
})
