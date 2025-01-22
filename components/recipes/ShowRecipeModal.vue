<template>
  <BModal v-model="open" title="Recipe Details" scrollable no-footer fullscreen>
    <BContainer v-if="recipe" fluid>
      <BRow>
        <BCol md="6">
          <BImg v-bind="imageProps" />
        </BCol>
        <BCol md="6">
          <p><strong>Difficulty:</strong> {{ recipe.difficulty }}</p>
          <p>
            <strong>Time Required:</strong>
            {{ formatTimeToReadable(recipe.time) }} minutes
          </p>

          <h5>Ingredients</h5>
          <ul>
            <li
              v-for="{ name, quantity, unit } in recipe.ingredients || []"
              :key="name"
            >
              {{ name }} ({{ quantity }} {{ unit || ingredientUnits[0] }})
            </li>
          </ul>

          <h5>Tags</h5>
          <BBadge
            v-for="{ id: key, text, variant } in recipe.tags || []"
            :key
            :variant="variant || 'secondary'"
            class="mr-2"
          >
            {{ text }}
          </BBadge>
        </BCol>
      </BRow>

      <BRow class="mt-4">
        <BCol>
          <h5>Steps</h5>
          <!-- eslint-disable-next-line vue/no-v-html sanitized on server -->
          <div v-html="recipe.steps"></div>
        </BCol>
      </BRow>
    </BContainer>
  </BModal>
</template>

<script setup lang="ts">
import { ingredientUnits, type ReadRecipeResponse } from '~/types/recipe'

const props = defineProps<{
  recipe: ReadRecipeResponse[number] | null
}>()

const open = defineModel<boolean>({
  required: true
})

const imageProps = computed(() => ({
  alt: props.recipe?.name,
  ...(props.recipe?.photos?.coverImage?.default
    ? {
        src: props.recipe.photos.coverImage.default
      }
    : {
        blank: true,
        width: '300',
        blankColor: 'grey'
      })
}))
</script>
