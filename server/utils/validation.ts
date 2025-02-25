import { z } from 'zod'
import {
  type CreateRecipePhotoRequest,
  type CreateRecipeTagRequest,
  recipeDifficulty,
  type CreateRecipeRequest,
  type UpdateRecipeRequest,
  recipeTagVariants
} from '../../types/recipe'
import { getRecipeTags } from './shared'

type ValidatorObject = Partial<Record<'params' | 'body' | 'query', unknown>>

const fileValidator = z.instanceof(Buffer)

const ingredientValidator = z.array(
  z.object({
    name: z.string().nonempty(),
    quantity: z.number().min(0),
    unit: z.string().nonempty()
  })
)
const photoValidator = fileValidator

const recipeTagValidator = z.object({
  text: z
    .string()
    .nonempty()
    .refine(
      async (value) => {
        const existingTags = await getRecipeTags()
        return !existingTags.some((tag) => tag.text === value)
      },
      { message: 'Tag with this text already exists' }
    ),
  variant: z.enum(recipeTagVariants).optional()
} satisfies Record<keyof CreateRecipeTagRequest, unknown>)
export const recipeTags = {
  read: {},
  create: {
    body: recipeTagValidator
  },
  delete: {
    params: z.object({
      id: z.string().nonempty().uuid()
    })
  }
} satisfies Record<string, ValidatorObject>

export const recipes = {
  show: {
    params: z.object({
      id: z.string().nonempty().uuid()
    })
  },
  create: {
    body: z.object({
      name: z.string().nonempty(),
      difficulty: z.enum(recipeDifficulty),
      ingredients: ingredientValidator,
      steps: z.string().nonempty(),
      time: z.number().min(1).int(),
      tags: z.array(z.string().nonempty().uuid()),
      coverImage: photoValidator.optional(),
      stepsImages: z.array(z.string().nonempty()).optional()
    } satisfies Record<
      keyof Omit<CreateRecipeRequest, 'photos'> | 'coverImage',
      unknown
    >)
  },
  update: {
    params: z.object({
      id: z.string().nonempty()
    }),
    body: z.object({
      difficulty: z.enum(recipeDifficulty),
      ingredients: ingredientValidator,
      steps: z.string().nonempty(),
      time: z.number().min(1).int(),
      name: z.string().nonempty(),
      tags: z.array(z.string().nonempty().uuid()),
      coverImage: photoValidator.optional()
    } satisfies Record<
      keyof Omit<UpdateRecipeRequest, 'photos'> | 'coverImage',
      unknown
    >)
  },
  delete: {
    params: z.object({
      id: z.string().nonempty()
    })
  },
  read: {}
} satisfies Record<string, ValidatorObject>

export const recipePhotos = {
  createCover: {
    body: z.object({
      file: fileValidator
    } satisfies Record<keyof CreateRecipePhotoRequest, unknown>),
    query: z
      .object({
        preserveAspectRatio: z.enum(['true', 'false']).optional(),
        id: z.string().nonempty().uuid().optional()
      })
      .optional()
  }
} satisfies Record<string, ValidatorObject>
