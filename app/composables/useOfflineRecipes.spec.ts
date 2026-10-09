import { describe, expect, it } from 'vitest'
import {
  offlinePhotoCacheName,
  offlineRecipeStorageKey
} from './useOfflineRecipes.client'

describe('offline recipe storage names', () => {
  it('separates browser recipe and photo caches by account', () => {
    expect(offlineRecipeStorageKey('first-user')).toBe('recipe-book:offline-recipes:first-user')
    expect(offlineRecipeStorageKey('second-user')).toBe('recipe-book:offline-recipes:second-user')
    expect(offlinePhotoCacheName('first-user')).toBe('recipe-book:offline-photos:first-user')
  })

  it('uses an isolated guest cache before login', () => {
    expect(offlineRecipeStorageKey()).toBe('recipe-book:offline-recipes:guest')
    expect(offlinePhotoCacheName()).toBe('recipe-book:offline-photos:guest')
  })
})
