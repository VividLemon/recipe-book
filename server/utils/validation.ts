import { array, enum as zodEnum, instanceof as zodInstanceof, number, object, string, uuidv7 } from 'zod'
import {
  type CreateRecipePhotoRequest,
  type CreateRecipeTagRequest,
  recipeDifficultyData,
  ingredientUnitsWeb,
  type CreateRecipeRequest,
  type UpdateRecipeRequest,
  recipeTagVariantsWeb
} from '../../types/recipe'
import { getRecipeTags } from './shared'

type ValidatorObject = Partial<Record<'params' | 'body' | 'query', unknown>>

const fileValidator = zodInstanceof(Buffer)

const ingredientValidator = array(
  object({
    name: string().nonempty(),
    quantity: number().min(0),
    unit: zodEnum(ingredientUnitsWeb)
  })
)
const photoValidator = fileValidator

const recipeTagValidator = object({
  text: string()
    .nonempty()
    .refine(
      async (value) => {
        const existingTags = await getRecipeTags()
        return !existingTags.some((tag) => tag.text === value)
      },
      { message: 'Tag with this text already exists' }
    ),
  variant: zodEnum(recipeTagVariantsWeb).optional()
} satisfies Record<keyof CreateRecipeTagRequest, unknown>)
export const recipeTags = {
  read: {},
  create: {
    body: recipeTagValidator
  },
  delete: {
    params: object({
      id: uuidv7()
    })
  }
} satisfies Record<string, ValidatorObject>

export const recipes = {
  show: {
    params: object({
      id: uuidv7()
    })
  },
  create: {
    body: object({
      name: string().nonempty(),
      difficulty: zodEnum(recipeDifficultyData),
      ingredients: ingredientValidator,
      steps: string().nonempty(),
      time: number().min(1).int(),
      tags: array(uuidv7()),
      coverImage: photoValidator.optional(),
      stepsImages: array(string().nonempty()).optional()
    } satisfies Record<
      keyof Omit<CreateRecipeRequest, 'photos'> | 'coverImage',
      unknown
    >)
  },
  update: {
    params: object({
      id: string().nonempty()
    }),
    body: object({
      difficulty: zodEnum(recipeDifficultyData),
      ingredients: ingredientValidator,
      steps: string().nonempty(),
      time: number().min(1).int(),
      name: string().nonempty(),
      tags: array(uuidv7()),
      coverImage: photoValidator.optional()
    } satisfies Record<
      keyof Omit<UpdateRecipeRequest, 'photos'> | 'coverImage',
      unknown
    >)
  },
  delete: {
    params: object({
      id: string().nonempty()
    })
  },
  read: {}
} satisfies Record<string, ValidatorObject>

export const recipePhotos = {
  createCover: {
    body: object({
      file: fileValidator
    } satisfies Record<keyof CreateRecipePhotoRequest, unknown>),
    query: object({
        preserveAspectRatio: zodEnum(['true', 'false']).optional(),
        id: uuidv7().optional()
      })
      .optional()
  }
} satisfies Record<string, ValidatorObject>
