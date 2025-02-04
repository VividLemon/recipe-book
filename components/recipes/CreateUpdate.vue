<template>
  <BContainer fluid>
    <RecipesShowRecipeModal
      v-model="previewOpen"
      preview-mode
      :recipe="previewRecipe"
    />
    <BRow>
      <BCol>
        <BFormInput
          v-model="recipe.name"
          placeholder="Name"
          v-bind="validateState('name')"
        />
        <BFormInvalidFeedback v-show="!validateState('name')?.state">
          {{ validateState('name')?.invalidFeedback }}
        </BFormInvalidFeedback>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BFormTags
          :model-value="recipe.ingredients.map((el) => el.name)"
          placeholder="Ingredients"
          v-bind="validateState('ingredients')"
          @update:model-value="onUpdateIngredient"
        />
        <BFormInvalidFeedback v-show="!validateState('ingredients')?.state">
          {{ validateState('ingredients')?.invalidFeedback }}
        </BFormInvalidFeedback>
        <template
          v-for="ingredient in recipe.ingredients"
          :key="ingredient.name"
        >
          <RecipesInputIngredient
            :model-value="ingredient"
            @update:model-value="onUpdateIngredientItem"
          />
        </template>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <label for="select-tags">Tags</label>
        <BInputGroup>
          <BFormSelect
            id="select-tags"
            v-model="recipe.tags"
            :options="recipeTagOptions"
            multiple
            value-field="id"
            text-field="text"
          />
          <BButton
            variant="outline-info"
            aria-label="Add Tag"
            @click="showAddModal = true"
            ><AddIcon
          /></BButton>
        </BInputGroup>
        <RecipesTagCreateModal
          v-model="showAddModal"
          :existing-tags="recipeTagOptions"
        />
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <ClientOnly>
          <TiptapEditor
            v-model="recipe.steps"
            :state="validateState('steps')?.state"
            :process-image="processImage"
            :dimensions-resize-warning="maximumRecipeStepsPhotoDimensions"
            @blur="v$.recipe.steps.$touch"
          />
        </ClientOnly>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BFormSelect
          v-model="recipe.difficulty"
          :options="recipeDifficulties"
          v-bind="validateState('difficulty')"
        />
        <BFormInvalidFeedback v-show="!validateState('difficulty')?.state">
          {{ validateState('difficulty')?.invalidFeedback }}
        </BFormInvalidFeedback>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BFormInput
          v-model="recipe.time"
          type="number"
          placeholder="Time in Minutes"
          v-bind="validateState('time')"
        />
        <BFormInvalidFeedback v-show="!validateState('time')?.state">
          {{ validateState('time')?.invalidFeedback }}
        </BFormInvalidFeedback>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BFormFile
          v-model="recipe.coverImage"
          label="Cover Image"
          :directory="nullHack"
          v-bind="validateState('coverImage')"
        />
        <BFormInvalidFeedback v-show="!validateState('coverImage')?.state">
          {{ validateState('coverImage')?.invalidFeedback }}
        </BFormInvalidFeedback>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BButton type="button" :loading variant="primary" @click="save"
          >Save</BButton
        >
        <BButton
          class="ms-1"
          variant="info"
          type="button"
          @click="previewOpen = true"
          >Preview</BButton
        >
        <BButton
          v-if="'id' in recipe"
          variant="danger"
          class="ms-1"
          :loading
          type="button"
          @click="emit('delete')"
        >
          Delete
        </BButton>
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { required, integer } from '@vuelidate/validators'
import {
  type CreateRecipeRequest,
  type Ingredient,
  ingredientUnits,
  type ReadRecipeResponse,
  recipeDifficulty,
  type UpdateRecipeRequest
} from '~/types/recipe'
import AddIcon from '~icons/bi/plus'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nullHack = null as any
const recipeDifficulties = [
  { value: null, text: 'Select Difficulty' },
  ...recipeDifficulty.map((el) => ({ value: el, text: el }))
]

defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  save: []
  'add-steps-image': [src: string]
  delete: []
}>()

const toaster = useToaster()

const showAddModal = ref(false)
const recipeTags = await useFetch('/api/recipe-tags')
watch(showAddModal, () => {
  recipeTags.refresh()
})
const recipeTagOptions = computed(() => recipeTags.data.value || [])

export type CreateRecipeModel = Omit<
  CreateRecipeRequest,
  'difficulty' | 'time' | 'photo'
> & {
  difficulty: null | string
  time: null | string
  coverImage: File | null
}
export type UpdateRecipeModel = (Omit<
  UpdateRecipeRequest,
  'difficulty' | 'time' | 'photo'
> & {
  difficulty: null | string
  time: null | string
  coverImage: File | null
}) & { id: string; raw: ReadRecipeResponse[number] | null }

const recipe = defineModel<CreateRecipeModel | UpdateRecipeModel>({
  required: true
})

const isUpdateRecipe = (
  val: CreateRecipeModel | UpdateRecipeModel
): val is UpdateRecipeModel => 'id' in val

const fileValidation = usePhotoFileValidation()
const v$ = useVuelidate(
  computed(() => ({
    recipe: {
      name: {
        required
      },
      difficulty: {
        required
      },
      time: {
        required,
        integer
      },
      steps: {
        required
      },
      ingredients: {
        required
      },
      coverImage: isUpdateRecipe(recipe.value) ? {} : fileValidation.value
    }
  })),
  { recipe }
)
const validateState = (val: keyof typeof recipe.value) => {
  const validated = v$.value.recipe[val]
  if (!validated) return undefined
  const e = {
    'onUpdate:modelValue': () => v$.value.recipe[val].$touch(),
    onBlur: () => v$.value.recipe[val].$touch()
  }
  return validated.$dirty
    ? {
        state: validateStateError(validated),
        invalidFeedback: validated.$errors[0]?.$message,
        ...e
      }
    : {
        ...e,
        state: null,
        invalidFeedback: null
      }
}
const onUpdateIngredient = (e: readonly string[]) => {
  e.forEach((el) => {
    // We can't update the individual elements here because we don't know the most recently updated element
    // The return is just everything
    if (recipe.value.ingredients.some((ingredient) => ingredient.name === el))
      return
    recipe.value.ingredients.push({
      name: el,
      quantity: 1,
      unit: ingredientUnits[0]
    })
  })
}
const onUpdateIngredientItem = (e: Ingredient) => {
  const index = recipe.value.ingredients.findIndex((el) => el.name === e.name)
  if (index === -1) return
  recipe.value.ingredients[index] = e
}

const save = async () => {
  if (!(await v$.value.$validate())) return
  emit('save')
}

const processImage = async ({
  data,
  preserveAspectRatio
}: {
  data: FormData
  preserveAspectRatio: boolean
}) => {
  try {
    const response = await $fetch('/api/recipes/photos/add-orphaned-image', {
      method: 'POST',
      body: data,
      query: {
        preserveAspectRatio: String(preserveAspectRatio),
        id: isUpdateRecipe(recipe.value) ? recipe.value.id : undefined
      }
    })

    const image = response.url

    emit('add-steps-image', image)

    return image || null
  } catch (e: unknown) {
    toaster.apiError(e)
    return null
  }
}

onBeforeUnmount(() => {
  $fetch('/api/recipes/photos/cleanup', {
    method: 'DELETE'
  })
})

const previewOpen = ref(false)
const previewRecipe = computed<ReadRecipeResponse[number]>(
  () =>
    ({
      createdAt: 0,
      difficulty:
        (recipe.value.difficulty as
          | ReadRecipeResponse[number]['difficulty']
          | null) || 'Easy',
      id: '',
      ingredients: recipe.value.ingredients,
      name: recipe.value.name,
      steps: recipe.value.steps,
      tags: recipeTagIdToRecipeTag(recipe.value.tags, recipeTagOptions.value),
      time: Number.parseInt(recipe.value.time || '0'),
      updatedAt: 0,
      photos: {
        coverImage: {
          thumbnail: '',
          default:
            recipe.value.coverImage instanceof File
              ? URL.createObjectURL(recipe.value.coverImage)
              : 'raw' in recipe.value &&
                  recipe.value.raw?.photos?.coverImage?.default
                ? recipe.value.raw.photos.coverImage.default
                : ''
        }
      }
    }) satisfies ReadRecipeResponse[number]
)
</script>
