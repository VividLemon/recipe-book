import { z } from 'zod'
import {
  recipeDifficulty,
  type CreateRecipeRequest,
  type UpdateRecipeRequest
} from '../../types/recipe'
import type { MultiPartData, ProcessPhotoInput } from './photo'

type ValidatorObject = Partial<Record<'params' | 'body' | 'query', unknown>>

export const recipes = {
  show: {
    params: z.object({
      id: z.string().nonempty().uuid()
    })
  },
  create: {
    body: z.object({
      name: z.string().nonempty(),
      difficulty: z.number().min(1).max(5).int(),
      ingredients: z.array(z.string()).nonempty(),
      steps: z.string().nonempty(),
      time: z.number().min(1).int(),
      photo: z
        .object({
          data: z.instanceof(Buffer),
          type: z.string().nonempty()
        } satisfies Record<keyof ProcessPhotoInput, unknown>)
        .optional()
    } satisfies Record<keyof CreateRecipeRequest, unknown>)
  },
  update: {
    params: z.object({
      id: z.string().nonempty()
    }),
    body: z.object({
      difficulty: z.enum(recipeDifficulty),
      ingredients: z.array(z.string()).nonempty(),
      steps: z.string().nonempty(),
      time: z.number().min(1).int(),
      name: z.string().nonempty(),
      photo: z
        .object({
          data: z.instanceof(Buffer),
          type: z.string().nonempty()
        } satisfies Record<keyof ProcessPhotoInput, unknown>)
        .optional()
    } satisfies Record<keyof UpdateRecipeRequest, unknown>)
  },
  delete: {
    params: z.object({
      id: z.string().nonempty()
    })
  },
  read: {}
} satisfies Record<string, ValidatorObject>

export const parseMultipartFormDataToRecipe = (
  acc: Record<string, unknown>,
  val: MultiPartData
) => {
  if (!val.name) return acc

  const asNumber = Number.parseInt(val.data as unknown as string, 10)
  const isPhoto = val.name === 'photo'
  const isTime = val.name === 'time'
  const isIngredients = val.name === 'ingredients'
  return {
    ...acc,
    [val.name]: val.data,
    photo: isPhoto
      ? ({
          data: val.data,
          type: val.type || ''
        } satisfies ProcessPhotoInput)
      : acc.photo,
    time: isTime && !Number.isNaN(asNumber) ? asNumber : acc.time,
    ingredients: isIngredients
      ? (val.data as unknown as string).split(',')
      : acc.ingredients
  }
}
