import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import CreateUpdate from './CreateUpdate.vue'

vi.mock('../../composables/useToaster', () => ({
  useToaster: () => ({
    apiSucceeded: vi.fn(),
    apiError: vi.fn()
  })
}))

describe('CreateUpdate', () => {
  it('renders the recipe form fields', async () => {
    const model = ref({
        name: '', ingredients: [], steps: '', difficulty: null, time: null,
        tags: [], coverImage: null, stepsImages: []
      })
    const wrapper = mount(defineComponent({
      components: { CreateUpdate },
      setup: () => ({ model }),
      template: '<Suspense><CreateUpdate v-model="model" :loading="false" /></Suspense>'
    }), {
      global: {
        stubs: {
          NuxtLink: true,
          RecipesShowRecipeModal: true,
          RecipesTagCreateModal: true,
          RecipesInputIngredient: true
        }
      }
    })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'BFormInput' }).props('placeholder')).toBe('Name')
    expect(wrapper.findComponent({ name: 'BFormTags' }).props('placeholder')).toBe('Ingredients')
  })
})
