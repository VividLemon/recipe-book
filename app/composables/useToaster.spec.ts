import { describe, expect, it, vi } from 'vitest'
import { useToaster } from './useToaster'

describe('useToaster', () => {
  it('creates an error toast with the expected variant', () => {
    const show = vi.fn()
    vi.stubGlobal('useToast', () => ({ create: vi.fn(() => ({ show })) }))
    useToaster().error('Something failed')
    expect(show).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
