import { describe, expect, it } from 'vitest'
import SettingsPage from './settings.vue'

describe('settings page', () => {
  it('exports the settings page', () => {
    expect(SettingsPage).toBeDefined()
  })
})
