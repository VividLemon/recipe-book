import type { BaseColorVariant } from 'bootstrap-vue-next'

export interface Photo {
  default: string
  thumbnail: string
}

export const recipeDifficulty = ['Easy', 'Medium', 'Hard'] as const
export interface Ingredient {
  name: string
  quantity: number
}

export type RecipeTagVariant = keyof Pick<
  BaseColorVariant,
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
>
export const recipeTagVariants = Object.freeze(
  Object.keys({
    primary: null,
    danger: null,
    info: null,
    secondary: null,
    success: null,
    warning: null,
    dark: null,
    light: null
  } satisfies Record<RecipeTagVariant, null>) as [RecipeTagVariant]
)
export type RecipeTag = {
  id: string
  createdAt: number
  text: string
  variant?: RecipeTagVariant
}
export type CreateRecipeTagRequest = Pick<RecipeTag, 'text' | 'variant'>

export interface Recipe {
  id: string
  createdAt: number
  updatedAt: number
  name: string
  ingredients: Ingredient[]
  tags: string[]
  steps: string
  difficulty: (typeof recipeDifficulty)[number]
  time: number
  photo?: Photo
}

export type UpdateRecipeRequest = Pick<
  Recipe,
  'name' | 'ingredients' | 'steps' | 'difficulty' | 'time' | 'tags'
> & { photo?: Buffer }

export type CreateRecipeRequest = Pick<
  Recipe,
  'name' | 'ingredients' | 'steps' | 'difficulty' | 'time' | 'tags'
> & { photo?: Buffer }

export type ReadRecipeResponse = (Pick<
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
> & { tags: RecipeTag[] })[]

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
> & { tags: RecipeTag[] }
