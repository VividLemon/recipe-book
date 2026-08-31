import type { BaseColorVariant } from 'bootstrap-vue-next'

// ============================================================================
// Data
// ============================================================================

export const recipeDifficultyData = ['Easy', 'Medium', 'Hard'] as const

export const ingredientUnitsData = [
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

  // Length (e.g. noodles)
  'inch',
  'centimeter',

  // Custom units
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

export type RecipeDifficultyData =
    (typeof recipeDifficultyData)[number]

export type IngredientUnitData =
    (typeof ingredientUnitsData)[number]

export interface PhotosData {
  coverImage?: {
    /**
     * Represents the default image URL.
     */
    default: string

    /**
     * Represents the thumbnail image URL.
     */
    thumbnail: string
  }

  /**
   * Represents the URLs of images that are part of the recipe steps.
   */
  stepsImages?: string[]
}

export type RecipeTagVariantData = keyof Pick<
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

export interface IngredientData {
  name: string
  quantity: number
  unit: IngredientUnitData
}

export interface RecipeData {
  id: string
  createdAt: number
  updatedAt: number
  name: string
  ingredients: IngredientData[]
  tags: string[]
  steps: string
  difficulty: RecipeDifficultyData
  time: number
  photos?: PhotosData
}

export interface RecipeTagData {
  id: string
  createdAt: number
  text: string
  variant?: RecipeTagVariantData
}

// ============================================================================
// Web contracts
// ============================================================================

export const recipeDifficultyWeb = ['Easy', 'Medium', 'Hard'] as const

export const ingredientUnitsWeb = [
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

  // Length (e.g. noodles)
  'inch',
  'centimeter',

  // Custom units
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

export type RecipeDifficultyWeb =
    (typeof recipeDifficultyWeb)[number]

export type IngredientUnitWeb =
    (typeof ingredientUnitsWeb)[number]

export interface PhotosWeb {
  coverImage?: {
    default: string
    thumbnail: string
  }

  stepsImages?: string[]
}

export type RecipeTagVariantWeb = keyof Pick<
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

export const recipeTagVariantsWeb = Object.freeze(
    Object.keys({
      primary: null,
      danger: null,
      info: null,
      secondary: null,
      success: null,
      warning: null,
      dark: null,
      light: null
    } satisfies Record<RecipeTagVariantWeb, null>) as RecipeTagVariantWeb[]
)

export interface IngredientWeb {
  name: string
  quantity: number
  unit: IngredientUnitWeb
}

export interface RecipeTagWeb {
  id: string
  createdAt: number
  text: string
  variant?: RecipeTagVariantWeb
}

export interface RecipeWeb {
  id: string
  createdAt: number
  updatedAt: number
  name: string
  ingredients: IngredientWeb[]
  tags: RecipeTagWeb[]
  steps: string
  difficulty: RecipeDifficultyWeb
  time: number
  photos?: PhotosWeb
}

// ============================================================================
// Web responses
// ============================================================================

export type ReadRecipeResponse = RecipeWeb[]

export type ShowRecipeResponse = RecipeWeb

// ============================================================================
// Web requests
// ============================================================================

export interface CreateRecipeTagRequest {
  text: string
  variant: RecipeTagVariantWeb
}

export interface CreateRecipePhotoRequest {
  file: Buffer
}

export interface AddOrphanRecipePhotosRequest {
  images: string[]
}

export interface UpdateRecipeRequest {
  name: string
  ingredients: IngredientWeb[]
  steps: string
  difficulty: RecipeDifficultyWeb
  time: number
  tags: string[]
  photos?: Buffer
}

export interface CreateRecipeRequest {
  name: string
  ingredients: IngredientWeb[]
  steps: string
  difficulty: RecipeDifficultyWeb
  time: number
  tags: string[]
  photos?: Buffer
  stepsImages?: string[]
}
