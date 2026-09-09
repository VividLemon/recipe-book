import { describe, expect, it, vi } from 'vitest'
import { configureVeeValidate } from './configureVeeValidate'

vi.mock('vee-validate', () => ({ configure: vi.fn() }))
vi.mock('@vee-validate/i18n', () => ({ localize: vi.fn(() => vi.fn()) }))

describe('configureVeeValidate', () => {
  it('is callable during application setup', () => {
    expect(() => configureVeeValidate()).not.toThrow()
  })
})
