<template>
  <BModal
    v-model="open"
    :title="
      isPreviewMode
        ? `Previewing Recipe: ${readableRecipe?.name || ''}`
        : readableRecipe?.name || 'Recipe Details'
    "
    scrollable
    no-footer
    fullscreen
    body-class="px-0"
  >
    <template v-if="readableRecipe">
      <BRow class="mb-2">
        <BCol>
          <BImg v-bind="imageProps" class="w-100" />
        </BCol>
      </BRow>
      <BContainer>
        <BRow>
          <BCol>
            <div>
              <p>
                <strong>Difficulty:</strong> {{ readableRecipe.difficulty }}
              </p>
              <p>
                <strong>Time Required:</strong>
                {{ readableRecipe.time }} minutes
              </p>
            </div>

            <div>
              <h5>Ingredients</h5>
              <ul>
                <li
                  v-for="{ name, quantity, unit } in readableRecipe.ingredients"
                  :key="name"
                >
                  {{ name }} ({{ quantity }} {{ unit || ingredientUnits[0] }})
                </li>
              </ul>
            </div>

            <div>
              <h5>Tags</h5>
              <BBadge
                v-for="{ id: key, text, variant } in readableRecipe.tags"
                :key
                :variant="variant || 'secondary'"
                class="mr-2"
              >
                {{ text }}
              </BBadge>
            </div>

            <div class="mt-3">
              <BButton
                :disabled="isPreviewMode"
                :to="
                  readableRecipe.id
                    ? `/recipes/edit/${readableRecipe.id}`
                    : undefined
                "
              >
                Edit Recipe
              </BButton>
              <BButton
                :disabled="isPreviewMode"
                class="ms-2"
                :variant="
                  !isFavorite(readableRecipe.id) ? 'success' : 'warning'
                "
                @click="toggleFavorite(readableRecipe.id)"
              >
                {{ isFavorite(readableRecipe.id) ? 'Remove from' : 'Add to' }}
                Favorites
              </BButton>
            </div>
          </BCol>
        </BRow>

        <BRow class="mt-4">
          <BCol>
            <h5>Steps</h5>
            <!-- eslint-disable-next-line vue/no-v-html sanitized on server -->
            <div v-html="readableRecipe.steps"></div>
          </BCol>
        </BRow>
      </BContainer>
    </template>
  </BModal>
</template>

<script setup lang="ts">
import { ingredientUnits, type ReadRecipeResponse } from '~/types/recipe'

const props = defineProps<{
  recipe: ReadRecipeResponse[number] | null
  previewMode?: boolean
}>()

const open = defineModel<boolean>({
  required: true
})

const { toggleFavorite, isFavorite } = useFavoriteRecipe()

const imageProps = computed(() => ({
  alt: readableRecipe.value?.name,
  ...(readableRecipe.value?.photos?.coverImage?.default
    ? {
        src: readableRecipe.value.photos.coverImage.default
      }
    : {
        blank: true,
        width: '300',
        blankColor: 'grey'
      })
}))

const readableRecipe = computed(() =>
  props.recipe === null ? null : mapRecipeToHumanReadable(props.recipe)
)

const isPreviewMode = computed(() => props.previewMode === true)
</script>
