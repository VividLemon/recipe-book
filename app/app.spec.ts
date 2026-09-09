import { describe, expect, it } from 'vitest'
import App from './app.vue'

describe('app shell', () => {
  it('exports the application shell', () => {
    expect(App).toBeDefined()
  })
})
