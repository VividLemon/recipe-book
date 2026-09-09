import { describe, expect, it } from 'vitest'
import { formatTimeToHumanReadable } from './time'

describe('formatTimeToHumanReadable', () => {
  it.each([
    [0, '0 minutes'],
    [1, '1 minute'],
    [60, '1 hour'],
    [125, '2 hours and 5 minutes']
  ])('formats %s minutes as %s', (minutes, result) => {
    expect(formatTimeToHumanReadable(minutes)).toBe(result)
  })
})
