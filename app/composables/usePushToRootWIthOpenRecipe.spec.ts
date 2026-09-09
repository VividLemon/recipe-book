import { describe, expect, it } from 'vitest'
import { usePushToRootWithOpenRecipe } from './usePushToRootWIthOpenRecipe'

describe('usePushToRootWithOpenRecipe', () => {
  it('exports the navigation composable', () => {
    expect(usePushToRootWithOpenRecipe).toBeTypeOf('function')
  })
})
