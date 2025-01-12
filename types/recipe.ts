import type { BaseColorVariant } from 'bootstrap-vue-next'

export interface Photos {
  coverImage?: {
    default: string
    thumbnail: string
  }
  stepsImages?: string[]
}

export const recipeDifficulty = ['Easy', 'Medium', 'Hard'] as const
export const ingredientUnits = [
  'units',
  // Volume
  'teaspoon',
  'tablespoon',
  'fluid ounce',
  'cup',
  'pint',
  'quart',
  'gallon',
  'milliliter',
  'liter',

  // Weight
  'gram',
  'kilogram',
  'ounce',
  'pound',

  // Quantity
  'piece',
  'slice',
  'clove',
  'stick',
  'can',
  'jar',
  'package',
  'bag',
  'box',

  // Length (e.g., noodles)
  'inch',
  'centimeter',

  // Custom Units (user-defined or region-specific)
  'dash',
  'pinch',
  'handful',
  'scoop',
  'bunch',

  // Other
  'sheet',
  'sprig',
  'stalk',
  'head',
  'cupcake',
  'loaf',
  'fillet',
  'chunk',
  'drop',
  'drizzle'
] as const
export interface Ingredient {
  name: string
  quantity: number
  unit: string
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
  photos?: Photos
}

export type UpdateRecipeRequest = Pick<
  Recipe,
  'name' | 'ingredients' | 'steps' | 'difficulty' | 'time' | 'tags'
> & { photos?: Buffer } & { stepsImages?: string[] }

export type CreateRecipeRequest = Pick<
  Recipe,
  'name' | 'ingredients' | 'steps' | 'difficulty' | 'time' | 'tags'
> & { photos?: Buffer } & { stepsImages?: string[] }

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
  | 'photos'
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
  | 'photos'
> & { tags: RecipeTag[] }

export type CreateRecipePhotoRequest = {
  file: Buffer
}

export type AddOrphanRecipePhotosRequest = {
  images: string[]
}
