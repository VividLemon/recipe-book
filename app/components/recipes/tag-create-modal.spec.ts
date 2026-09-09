import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TagCreateModal from './TagCreateModal.vue'

vi.mock('../../composables/useToaster', () => ({
  useToaster: () => ({
    apiSucceeded: vi.fn(),
    apiError: vi.fn()
  })
}))

describe('TagCreateModal', () => {
  it('renders tag inputs and action buttons', () => {
    const wrapper = mount(TagCreateModal, {
      props: { modelValue: true, existingTags: [] },
      global: {
        stubs: {
          BModal: { template: '<div><slot /><slot name="footer" /></div>' }
        }
      }
    })

    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.text()).toContain('Cancel')
    expect(wrapper.text()).toContain('Add')
  })
})
