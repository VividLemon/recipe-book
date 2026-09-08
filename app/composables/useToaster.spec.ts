import { describe, expect, it } from 'vitest'
import { useToaster } from './useToaster'

describe('useToaster', () => {
  it('exports the toaster composable', () => {
    expect(useToaster).toBeTypeOf('function')
  })
})
