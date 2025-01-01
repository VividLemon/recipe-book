import { z } from 'zod'
import {
  type CreateRecipeTagRequest,
  recipeDifficulty,
  type CreateRecipeRequest,
  type UpdateRecipeRequest,
  recipeTagVariants
} from '../../types/recipe'
import type { CreatePhotoRequest } from '../../types/photo'
import { getRecipeTags } from './shared'

type ValidatorObject = Partial<Record<'params' | 'body' | 'query', unknown>>

// TODO
const fileValidator = z.instanceof(Buffer)

export const photos = {
  create: {
    body: z.object({
      file: fileValidator
    } satisfies Record<keyof CreatePhotoRequest, unknown>)
  }
} satisfies Record<string, ValidatorObject>

const ingredientValidator = z.array(
  z.object({
    name: z.string().nonempty(),
    quantity: z.number().min(1)
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
      photo: photoValidator.optional()
    } satisfies Record<keyof CreateRecipeRequest, unknown>)
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
      photo: photoValidator.optional()
    } satisfies Record<keyof UpdateRecipeRequest, unknown>)
  },
  delete: {
    params: z.object({
      id: z.string().nonempty()
    })
  },
  read: {}
} satisfies Record<string, ValidatorObject>
