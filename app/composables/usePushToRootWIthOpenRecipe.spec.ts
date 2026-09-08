import { describe, expect, it, vi } from 'vitest'
import { usePushToRootWithOpenRecipe } from './usePushToRootWIthOpenRecipe'

describe('usePushToRootWithOpenRecipe', () => {
  it('navigates to the root with the recipe query', () => {
    const push = vi.fn()
    vi.stubGlobal('useRouter', () => ({ push }))
    usePushToRootWithOpenRecipe().execute('recipe-1')
    expect(push).toHaveBeenCalledWith({ path: '/', query: { openRecipe: 'recipe-1' } })
    vi.unstubAllGlobals()
  })
})
