import { describe, expect, it } from 'vitest'
import HomePage from './index.vue'

describe('home page', () => {
  it('exports the home page', () => {
    expect(HomePage).toBeDefined()
  })
})
