export interface Photo {
  default: string
  thumbnail: string
}

export interface Recipe {
  id: string
  createdAt: number
  updatedAt: number
  name: string
  ingredients: string[]
  steps: string[]
  difficulty: number
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
