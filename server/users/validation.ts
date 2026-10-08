import { boolean, object, string, uuidv7 } from 'zod'

export const passwordUpdate = object({
  oldPassword: string().min(1).max(128),
  newPassword: string().min(1).max(128)
})

export const favoriteUpdate = object({
  recipeId: uuidv7(),
  favorite: boolean()
})
