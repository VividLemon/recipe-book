import { z } from 'zod'
import {
  recipeDifficulty,
  type CreateRecipeRequest,
  type UpdateRecipeRequest
} from '../../types/recipe'
import type { ProcessPhotoInput } from './photo'

type ValidatorObject = Partial<Record<'params' | 'body' | 'query', unknown>>

export const photo = {
  delete: {
    params: z.object({
      id: z.string().nonempty()
    })
  },
  create: {
    body: z.array(
      z.object({
        data: z.instanceof(Buffer),
        type: z.string().nonempty()
      } satisfies Record<keyof ProcessPhotoInput, unknown>)
    )
  }
} satisfies Record<string, ValidatorObject>

const ingredientValidator = z.array(
  z.object({
    name: z.string().nonempty(),
    quantity: z.number().min(1)
  })
)
const photoValidator = z.object({
  data: z.instanceof(Buffer),
  type: z.string().nonempty()
} satisfies Record<keyof ProcessPhotoInput, unknown>)

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

// Could use serialization.formDataToObj
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
    // Assume string if !val.type
    [val.name]: !val.type ? val.data.toString('utf-8') : val.data,
    photo: isPhoto
      ? ({
          data: val.data,
          type: val.type || ''
        } satisfies ProcessPhotoInput)
      : acc.photo,
    time: isTime && !Number.isNaN(asNumber) ? asNumber : acc.time,
    ingredients: isIngredients
      ? JSON.parse(val.data as unknown as string)
      : acc.ingredients
  }
}
