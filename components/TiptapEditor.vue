<template>
  <BButtonGroup>
    <BButton
      v-for="(button, index) in buttons"
      :key="index"
      :active="button.active"
      @click="button.onClick"
    >
      <div v-if="typeof button.content === 'string'">{{ button.content }}</div>
      <component :is="button.content" v-else />
    </BButton>
  </BButtonGroup>
  <EditorContent :editor />
  <TiptapEditorImageModal v-model="showImageModal" @change="addImage" />
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
import type { Photo } from '../types/recipe'
import type { ValidationState } from 'bootstrap-vue-next'

const props = withDefaults(
  defineProps<{
    state?: ValidationState
  }>(),
  { state: null }
)
const emit = defineEmits<{
  blur: [FocusEvent]
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

const addImage = (url: Photo | null) => {
  if (url) {
    editor.value?.chain().focus().setImage({ src: url.default }).run()
  }
}

const buttons = computed(() => [
  {
    content: markRaw(H1Icon),
    active: editor.value?.isActive('heading', { level: 1 }),
    onClick: () =>
      editor.value?.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    content: markRaw(H2Icon),
    active: editor.value?.isActive('heading', { level: 2 }),
    onClick: () =>
      editor.value?.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    content: markRaw(H3Icon),
    active: editor.value?.isActive('heading', { level: 3 }),
    onClick: () =>
      editor.value?.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    content: markRaw(ListOlIcon),
    active: editor.value?.isActive('orderedList'),
    onClick: () => editor.value?.chain().focus().toggleOrderedList().run()
  },
  {
    content: markRaw(ListUlIcon),
    active: editor.value?.isActive('bulletList'),
    onClick: () => editor.value?.chain().focus().toggleBulletList().run()
  },
  {
    content: markRaw(BoldIcon),
    active: editor.value?.isActive('bold'),
    onClick: () => editor.value?.chain().focus().toggleBold().run()
  },
  {
    content: markRaw(ItalicIcon),
    active: editor.value?.isActive('italic'),
    onClick: () => editor.value?.chain().focus().toggleItalic().run()
  },
  {
    content: markRaw(ImageIcon),
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
