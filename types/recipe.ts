export interface Photo {
  default: string
  thumbnail: string
}

export const recipeDifficulty = ['Easy', 'Medium', 'Hard'] as const
export interface Ingredient {
  name: string
  quantity: number
}

export interface Recipe {
  id: string
  createdAt: number
  updatedAt: number
  name: string
  ingredients: Ingredient[]
  steps: string
  difficulty: (typeof recipeDifficulty)[number]
  time: number
  photo?: Photo
}

export type UpdateRecipeRequest = Pick<
  Recipe,
  'name' | 'ingredients' | 'steps' | 'difficulty' | 'time'
> & { photo?: Buffer }

export type CreateRecipeRequest = Pick<
  Recipe,
  'name' | 'ingredients' | 'steps' | 'difficulty' | 'time'
> & { photo?: Buffer }

export type ReadRecipeResponse = Pick<
  Recipe,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'ingredients'
  | 'steps'
  | 'difficulty'
  | 'time'
  | 'photo'
>[]

export type ShowRecipeResponse = Pick<
  Recipe,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'ingredients'
  | 'steps'
  | 'difficulty'
  | 'time'
  | 'photo'
>
