<template>
  <BButtonGroup>
    <BButton
      v-for="(button, index) in buttons"
      :key="index"
      :active="button.active"
      :aria-label="button.ariaLabel || undefined"
      @click="button.onClick"
    >
      <div v-if="typeof button.content === 'string'">{{ button.content }}</div>
      <component :is="button.content" v-else />
    </BButton>
  </BButtonGroup>
  <EditorContent :editor />
  <TiptapEditorImageModal
    v-model="showImageModal"
    :dimensions-resize-warning
    :loading="isUploadingImage"
    @add-image="onAddImage"
  />
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import BoldIcon from '~icons/bi/type-bold'
import ItalicIcon from '~icons/bi/type-italic'
import ImageIcon from '~icons/bi/image'
import ListUlIcon from '~icons/bi/list-ul'
import ListOlIcon from '~icons/bi/list-ol'
import H1Icon from '~icons/bi/type-h1'
import H2Icon from '~icons/bi/type-h2'
import H3Icon from '~icons/bi/type-h3'
import type { ValidationState } from 'bootstrap-vue-next'

const props = withDefaults(
  defineProps<{
    state?: ValidationState
    /**
     * The editor doesn't have the responsibility of processing the image. We need to tell it how to do it.
     *
     * @param data - FormData with image file
     *
     * @returns The URL of the uploaded image or null if the upload failed
     */
    processImage: (data: {
      data: FormData
      preserveAspectRatio: boolean
    }) => Promise<string | null>
    dimensionsResizeWarning?: { height: number; width: number } | null
  }>(),
  { state: null, dimensionsResizeWarning: null }
)
const emit = defineEmits<{
  blur: [FocusEvent]
  'add-image': [src: string]
}>()

const showImageModal = ref(false)

const modelValue = defineModel<string>({
  required: true
})

const stateClass = useStateClass(() => props.state)

const editor = useEditor({
  content: modelValue.value,
  extensions: [StarterKit, Image],
  onUpdate: () => {
    modelValue.value = editor.value?.getHTML() || ''
  },
  editorProps: {
    attributes: {
      class: 'form-control'
    },
    handleDOMEvents: {
      blur: (_, v) => emit('blur', v)
    }
  }
})

const isUploadingImage = ref(false)
const onAddImage = async (data: {
  data: FormData
  preserveAspectRatio: boolean
}) => {
  try {
    isUploadingImage.value = true
    const src = await props.processImage(data)
    setTimeout(() => {
      if (src) editor.value?.chain().focus().setImage({ src }).run()
    }, 1000)
  } finally {
    isUploadingImage.value = false
    showImageModal.value = false
  }
}

const buttons = computed(() => [
  {
    content: markRaw(H1Icon),
    ariaLabel: 'Heading 1',
    active: editor.value?.isActive('heading', { level: 1 }),
    onClick: () =>
      editor.value?.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    content: markRaw(H2Icon),
    ariaLabel: 'Heading 2',
    active: editor.value?.isActive('heading', { level: 2 }),
    onClick: () =>
      editor.value?.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    content: markRaw(H3Icon),
    ariaLabel: 'Heading 3',
    active: editor.value?.isActive('heading', { level: 3 }),
    onClick: () =>
      editor.value?.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    content: markRaw(ListOlIcon),
    ariaLabel: 'Ordered List',
    active: editor.value?.isActive('orderedList'),
    onClick: () => editor.value?.chain().focus().toggleOrderedList().run()
  },
  {
    content: markRaw(ListUlIcon),
    ariaLabel: 'Unordered List',
    active: editor.value?.isActive('bulletList'),
    onClick: () => editor.value?.chain().focus().toggleBulletList().run()
  },
  {
    content: markRaw(BoldIcon),
    ariaLabel: 'Bold',
    active: editor.value?.isActive('bold'),
    onClick: () => editor.value?.chain().focus().toggleBold().run()
  },
  {
    content: markRaw(ItalicIcon),
    ariaLabel: 'Italic',
    active: editor.value?.isActive('italic'),
    onClick: () => editor.value?.chain().focus().toggleItalic().run()
  },
  {
    content: markRaw(ImageIcon),
    ariaLabel: 'Add Image',
    onClick: () => {
      showImageModal.value = true
    }
  }
])

watch(modelValue, (newValue) => {
  if (!editor.value) return
  const isSame = editor.value.getHTML() === newValue
  if (isSame) return
  editor.value.commands.setContent(newValue, false)
})
watch(
  stateClass,
  (newValue) => {
    editor.value?.setOptions({
      ...editor.value.options,
      editorProps: {
        ...editor.value.options.editorProps,
        attributes: {
          class: `form-control ${newValue}`
        }
      }
    })
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>
