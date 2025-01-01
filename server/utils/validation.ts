import { z } from 'zod'
import {
  recipeDifficulty,
  type CreateRecipeRequest,
  type UpdateRecipeRequest
} from '../../types/recipe'
import type { CreatePhotoRequest } from '../../types/photo'

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
