import { describe, expect, it } from 'vitest'
import { useSystemSettings } from './useSystemSettings'

describe('useSystemSettings', () => {
  it('reports usage outside a provider', () => {
    expect(() => useSystemSettings()).toThrow('System settings not provided')
  })
})
