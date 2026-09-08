import { describe, expect, it } from 'vitest'
import { errorToString } from './errors'

describe('errorToString', () => {
  it('formats validation issues', () => {
    expect(errorToString({
      data: { data: { issues: [{ path: ['name'], message: 'Required' }] } }
    })).toBe('Validation Error: NAME: Required')
  })

  it('formats response and native errors', () => {
    expect(errorToString({ data: { message: 'Unavailable' } })).toBe('Response: Unavailable')
    expect(errorToString(new Error('Broken'))).toBe('Response Broken')
    expect(errorToString('unknown')).toBe('unknown')
  })
})
