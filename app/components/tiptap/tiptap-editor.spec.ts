import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TiptapEditor from './TiptapEditor.vue'

describe('TiptapEditor', () => {
  it('renders formatting controls and the editor content', () => {
    const wrapper = mount(TiptapEditor, {
      props: {
        modelValue: '<p>Recipe steps</p>',
        processImage: async () => null
      },
      global: {
        stubs: {
          EditorContent: { template: '<div class="editor-content" />' },
          TiptapEditorImageModal: true
        }
      }
    })

    expect(wrapper.find('.editor-content').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Bold"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Add Image"]').exists()).toBe(true)
  })
})
