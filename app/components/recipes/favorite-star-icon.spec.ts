import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FavoriteStarIcon from './FavoriteStarIcon.vue'

vi.mock('../../composables/useToaster', () => ({
  useToaster: () => ({
    apiSucceeded: vi.fn(),
    apiError: vi.fn()
  })
}))

describe('FavoriteStarIcon', () => {
  it('renders a star for the supplied recipe', () => {
    const wrapper = mount(FavoriteStarIcon, {
      props: { id: 'recipe-1' },
      global: { stubs: { StarIcon: { template: '<svg />' } } }
    })

    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
