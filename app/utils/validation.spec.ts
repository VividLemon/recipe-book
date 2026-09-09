import { describe, expect, it } from 'vitest'
import { validateStateError } from './validation'

describe('validateStateError', () => {
  it('returns invalid for dirty invalid fields', () => {
    expect(validateStateError({ dirty: true, valid: false } as never)).toBe(false)
  })

  it('does not show an error for clean or valid fields', () => {
    expect(validateStateError({ dirty: false, valid: false } as never)).toBeNull()
    expect(validateStateError({ dirty: true, valid: true } as never)).toBeNull()
  })
})
