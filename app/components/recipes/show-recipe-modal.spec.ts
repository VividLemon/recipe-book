import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ShowRecipeModal from './ShowRecipeModal.vue'

vi.mock('../../composables/useSystemSettings', () => ({
  useSystemSettings: () => ({
    dense: { prefersDenseRecipeModal: { value: false } },
    downloads: { preferredDownloadFileType: { value: 'json' } }
  })
}))

describe('ShowRecipeModal', () => {
  it('renders recipe details when a recipe is provided', () => {
    const recipe = {
      id: 'recipe-1',
      createdAt: 0,
      updatedAt: 0,
      name: 'Soup',
      ingredients: [{ name: 'Water', quantity: 1, unit: 'cup' as const }],
      tags: [],
      steps: 'Boil water',
      difficulty: 'Easy' as const,
      time: 15
    }
    const wrapper = mount(ShowRecipeModal, {
      props: { modelValue: true, recipe },
      global: { stubs: { BModal: { template: '<div><slot name="header" /><slot /></div>' } } }
    })

    expect(wrapper.text()).toContain('Soup')
    expect(wrapper.text()).toContain('Water')
    expect(wrapper.text()).toContain('Boil water')
  })
})
