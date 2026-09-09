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
          v-model="name"
          placeholder="Name"
          v-bind="nameAttrs"
        />
        <BFormInvalidFeedback v-show="!nameAttrs.state">
          {{ nameAttrs.invalidFeedback }}
        </BFormInvalidFeedback>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BFormTags
          :model-value="ingredients.map((el) => el.name)"
          placeholder="Ingredients"
          v-bind="ingredientsAttrs"
          @tag-added="(els) => {
            els.forEach((el) => {ingredients.push({
              name: el,
              quantity: 1,
              unit: ingredientUnitsWeb[0]
            })})
          }"
        />
        <BFormInvalidFeedback v-show="!ingredientsAttrs.state">
          {{ ingredientsAttrs.invalidFeedback }}
        </BFormInvalidFeedback>
        <template
          v-for="ingredient in ingredients"
          :key="ingredient.name"
        >
          <RecipesInputIngredient
            :model-value="ingredient"
            :name="ingredient.name"
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
            v-model="steps"
            :state="stepsAttrs.state"
            :process-image="processImage"
            :dimensions-resize-warning="maximumRecipeStepsPhotoDimensions"
            @blur="stepsAttrs.onBlur"
          />
        </ClientOnly>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BFormSelect
          v-model="difficulty"
          :options="recipeDifficulties"
          v-bind="difficultyAttrs"
        />
        <BFormInvalidFeedback v-show="!difficultyAttrs.state">
          {{ difficultyAttrs.invalidFeedback }}
        </BFormInvalidFeedback>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BFormInput
          v-model="time"
          type="number"
          placeholder="Time in Minutes"
          v-bind="timeAttrs"
        />
        <BFormInvalidFeedback v-show="!timeAttrs.state">
          {{ timeAttrs.invalidFeedback }}
        </BFormInvalidFeedback>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BFormFile
          v-model="coverImage"
          label="Cover Image"
          :directory="nullHack"
          v-bind="coverImageAttrs"
        />
        <BFormInvalidFeedback v-show="!coverImageAttrs.state">
          {{ coverImageAttrs.invalidFeedback }}
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
import {
  type CreateRecipeRequest,
  type IngredientWeb,
  ingredientUnitsWeb,
  type ImageFormatVariants,
  type ReadRecipeResponse,
  recipeDifficultyWeb,
  type RecipeDifficultyWeb,
  type UpdateRecipeRequest, type RecipeWeb
} from '../../../types/recipe'
import AddIcon from '~icons/bi/plus'
import {object, string, number, array, enum as zEnum} from 'zod'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nullHack = null as any
const recipeDifficulties = [
  { value: null, text: 'Select Difficulty' },
  ...recipeDifficultyWeb.map((el) => ({ value: el, text: el }))
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
  difficulty: RecipeDifficultyWeb | null
  time: null | string
  coverImage: File | null
}
export type UpdateRecipeModel = (Omit<
  UpdateRecipeRequest,
  'difficulty' | 'time' | 'photo'
> & {
  difficulty: RecipeDifficultyWeb | null
  time: null | string
  coverImage: File | null
}) & { id: string; raw: ReadRecipeResponse[number] | null }

const recipe = defineModel<CreateRecipeModel | UpdateRecipeModel>({
  required: true
})

const isUpdateRecipe = (
  val: CreateRecipeModel | UpdateRecipeModel
): val is UpdateRecipeModel => 'id' in val

// `CreateRecipeModel`/`UpdateRecipeModel` diverge on a few fields (`id`, `raw`, `tags`,
// `stepsImages`) that vee-validate doesn't need to know about. Unifying the fields that
// are actually validated into a single shape here keeps `initialValues` and
// `validationSchema` in agreement (see vee-validate's typed schemas guide), and the two
// models are re-separated again in `save` when merging the submitted values back in.
interface RecipeFormValues {
  name: string
  difficulty: RecipeDifficultyWeb | null
  time: string | null
  steps: string
  ingredients: IngredientWeb[]
  coverImage: File | null
}

interface RecipeFormOutput {
  name: string
  difficulty: RecipeDifficultyWeb | null
  time: number
  steps: string
  ingredients: IngredientWeb[]
  coverImage: File | null
}

const fileValidation = usePhotoFileValidation()
const {
  handleSubmit,
  defineField
} = useForm<RecipeFormValues, RecipeFormOutput>({
  initialValues: recipe.value,
  validationSchema: computed(() => {
    const coverImage = fileValidation(isUpdateRecipe(recipe.value))
    return toTypedSchema(object({
      name: string().min(1, 'Name is required'),
      difficulty: zEnum(recipeDifficultyWeb).nullable().refine((v) => v !== null, 'Difficulty is required'),
      time: string()
        .nullable()
        .refine((v) => v !== null && v.length > 0, 'Time is required')
        .transform((v) => Number(v))
        .pipe(number().int('Time must be an integer').min(1, 'Time must be at least 1 minute')),
      steps: string().min(1, 'Steps are required'),
      ingredients: array(object({
        name: string().min(1, 'Ingredient name is required'),
        quantity: number(),
        unit: zEnum(ingredientUnitsWeb)
      })).min(1, 'Ingredients are required'),
      coverImage
    }))
  }),
})

const [name, nameAttrs] = defineField('name')
const [ingredients, ingredientsAttrs] = defineField('ingredients')
const [steps, stepsAttrs] = defineField('steps')
const [difficulty, difficultyAttrs] = defineField('difficulty')
const [time, timeAttrs] = defineField('time')
const [coverImage, coverImageAttrs] = defineField('coverImage')

const onUpdateIngredientItem = (e: IngredientWeb) => {
  const index = ingredients.value.findIndex((el) => el.name === e.name)
  if (index === -1) return
  ingredients.value[index] = e
}

const save = handleSubmit((submitted) => {
  // `submitted` is validated/typed strictly (e.g. `time` is a `number`), while
  // `recipe` keeps the looser editable shape (e.g. `time` is a `string`), so we
  // convert the pieces that differ before merging back.
  recipe.value = {
    ...recipe.value,
    ...submitted,
    time: submitted.time.toString()
  }
  emit('save')
})

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
    await using _ = await toaster.apiError(e)
    return null
  }
}

onBeforeUnmount(() => {
  $fetch('/api/recipes/photos/cleanup', {
    method: 'DELETE'
  })
})

const previewOpen = ref(false)
const toImageVariants = (value: string): ImageFormatVariants => ({
  original: value,
  webp: value,
  avif: value
})
const previewRecipe = computed<RecipeWeb>(
  () =>
    ({
      createdAt: 0,
      difficulty:
        (difficulty.value as
          | RecipeWeb['difficulty']
          | null) || 'Easy',
      id: '',
      ingredients: ingredients.value,
      name: name.value,
      steps: steps.value,
      tags: recipeTagIdToRecipeTag(recipe.value.tags, recipeTagOptions.value),
      time: Number.parseInt(time.value || '0'),
      updatedAt: 0,
      photos: {
        coverImage: {
          thumbnail: toImageVariants(''),
          default: toImageVariants(
            coverImage.value instanceof File
              ? URL.createObjectURL(coverImage.value)
              : ('raw' in recipe.value
                  ? recipe.value.raw?.photos?.coverImage?.default.original
                  : undefined) ?? ''
          )
        }
      }
    }) satisfies RecipeWeb
)
</script>
