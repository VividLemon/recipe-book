<template>
  <BInputGroup>
    <BFormInput
      :id
      v-model="model"
      :autocomplete
      :type="visible ? 'text' : 'password'"
      :state
      v-bind="$attrs"
    />
    <template #append>
      <BButton
        type="button"
        variant="outline-secondary"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <EyeSlashIcon v-if="visible" />
        <EyeIcon v-else />
      </BButton>
    </template>
  </BInputGroup>
</template>

<script setup lang="ts">
import EyeIcon from '~icons/bi/eye'
import EyeSlashIcon from '~icons/bi/eye-slash'

defineOptions({ inheritAttrs: false })

defineProps<{
  id: string
  autocomplete: string
  state?: boolean | null
}>()

const model = defineModel<string | undefined>({ required: true })
const visible = ref(false)
</script>
