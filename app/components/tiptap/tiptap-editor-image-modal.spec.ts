import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TiptapEditorImageModal from './TiptapEditorImageModal.vue'

describe('TiptapEditorImageModal', () => {
  it('renders upload controls and modal actions', () => {
    const wrapper = mount(TiptapEditorImageModal, {
      props: { modelValue: true, loading: false },
      global: {
        stubs: {
          BModal: { template: '<div><slot /><slot name="footer" /></div>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Upload Image')
    expect(wrapper.text()).toContain('Preserve aspect ratio')
    expect(wrapper.text()).toContain('Cancel')
    expect(wrapper.text()).toContain('Ok')
  })
})
