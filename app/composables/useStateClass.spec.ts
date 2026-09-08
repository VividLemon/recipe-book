import { describe, expect, it } from 'vitest'
import { useStateClass } from './useStateClass'

describe('useStateClass', () => {
  it.each([
    [true, 'is-valid'],
    [false, 'is-invalid'],
    [null, null]
  ] as const)('maps %s to %s', (state, result) => {
    expect(useStateClass(state).value).toBe(result)
  })
})
