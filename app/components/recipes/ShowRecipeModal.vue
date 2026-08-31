<template>
  <BModal v-model="open" scrollable no-footer fullscreen body-class="px-0">
    <template #header>
      <h5 class="modal-title">
        {{
          previewMode
            ? `Previewing Recipe: ${readableRecipe?.name || ''}`
            : readableRecipe?.name || 'Recipe Details'
        }}
      </h5>
      <div class="ms-auto d-flex align-items-center">
        <template v-if="readableRecipe">
          <BButton
            :disabled="previewMode"
            :variant="null"
            :to="
              readableRecipe.id
                ? `/recipes/edit/${readableRecipe.id}`
                : undefined
            "
            aria-label="Edit Recipe"
          >
            <PencilIcon />
          </BButton>
          <BButton :variant="null" @click="toggleFavorite(readableRecipe.id)">
            <RecipesFavoriteStarIcon
              :id="readableRecipe.id"
              aria-label="Toggle favorite recipe"
            />
          </BButton>
        </template>
        <BCloseButton variant="secondary" @click="open = false"
          >Close</BCloseButton
        >
      </div>
    </template>
    <template v-if="readableRecipe">
      <BRow v-show="!systemSettings.dense.prefersDenseRecipeModal.value" class="mb-2">
        <BCol class="d-flex justify-content-center">
          <BImg v-bind="imageProps" height="500" />
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
              <h5>
                Ingredients
                <BButton
                  :variant="null"
                  aria-label="Download Ingredients"
                  @click="downloadIngredients"
                >
                  <InfoIcon />
                </BButton>
              </h5>
              <ul v-if="!systemSettings.dense.prefersDenseRecipeModal.value">
                <li
                  v-for="{ name, quantity, unit } in readableRecipe.ingredients"
                  :key="name"
                >
                  {{ name }} ({{ quantity }} {{ unit || ingredientUnitsWeb[0] }})
                </li>
              </ul>
              <div v-else>
                {{
                  readableRecipe.ingredients
                    .map(({ name: n, quantity, unit }) => `${n} (${quantity} ${unit || ingredientUnitsWeb[0]})`)
                    .join(', ')
                }}
              </div>
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
          </BCol>
        </BRow>

        <BRow class="mt-4">
          <BCol>
            <h5>Steps</h5>
            <!-- eslint-disable-next-line vue/no-v-html sanitized on server -->
            <div v-html="readableRecipe.steps" />
          </BCol>
        </BRow>
      </BContainer>
    </template>
  </BModal>
</template>

<script setup lang="ts">
import { ingredientUnitsWeb, type ReadRecipeResponse } from '../../../types/recipe'
import InfoIcon from '~icons/bi/file-earmark-arrow-down'
import PencilIcon from '~icons/bi/pencil'

const props = defineProps<{
  recipe: ReadRecipeResponse[number] | null
  previewMode?: boolean
}>()

const open = defineModel<boolean>({
  required: true
})

const { toggleFavorite } = useFavoriteRecipe()

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

const systemSettings = useSystemSettings()

const downloadIngredients = () => {
  if (!readableRecipe.value) return
  const data = readableRecipe.value.ingredients.map(
    ({ name, quantity, unit }) => ({
      name,
      quantity,
      unit
    })
  )
  const fileDownloadType = systemSettings.downloads.preferredDownloadFileType.value
  downloadByClick({
    blob: objectToBlobSerializers[fileDownloadType](data, { human: true }),
    filename: `${readableRecipe.value.name}.ingredients.${fileDownloadType}`
  })
}
</script>
