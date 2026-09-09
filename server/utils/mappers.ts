import type {
  IngredientData,
  IngredientUnitData,
  IngredientUnitWeb,
  IngredientWeb,
  PhotosData,
  PhotosWeb,
  RecipeData,
  RecipeDifficultyData,
  RecipeDifficultyWeb,
  RecipeTagData,
  RecipeTagWeb,
  RecipeWeb
} from '../../types/recipe'

// ============================================================================
// Web → Data
// ============================================================================

export const mapIngredientUnitWebToData = (
  unit: IngredientUnitWeb
): IngredientUnitData => unit

export const mapIngredientUnitDataToWeb = (
  unit: IngredientUnitData
): IngredientUnitWeb => unit

export const mapIngredientWebToData = (
  ingredient: IngredientWeb
): IngredientData => ({
  name: ingredient.name,
  quantity: ingredient.quantity,
  unit: mapIngredientUnitWebToData(ingredient.unit)
})

export const mapRecipeDifficultyWebToData = (
  difficulty: RecipeDifficultyWeb
): RecipeDifficultyData => difficulty

// ============================================================================
// Data → Web
// ============================================================================

export const mapIngredientDataToWeb = (
  ingredient: IngredientData
): IngredientWeb => ({
  name: ingredient.name,
  quantity: ingredient.quantity,
  unit: mapIngredientUnitDataToWeb(ingredient.unit)
})

export const mapPhotosDataToWeb = (photos: PhotosData): PhotosWeb => ({
  coverImage: photos.coverImage,
  stepsImages: photos.stepsImages
})

export const mapRecipeTagDataToWeb = (tag: RecipeTagData): RecipeTagWeb => ({
  id: tag.id,
  createdAt: tag.createdAt,
  text: tag.text,
  variant: tag.variant
})

const createRecipeTagFallback = (): RecipeTagWeb => ({
  createdAt: Date.now(),
  id: '',
  text: '',
  variant: undefined
})

export const recipeTagIdsToRecipeTagsWeb = (
  ids: string[],
  tags: RecipeTagData[]
): RecipeTagWeb[] =>
  ids.map((tagId) => {
    const found = tags.find((tag) => tag.id === tagId)
    return found ? mapRecipeTagDataToWeb(found) : createRecipeTagFallback()
  })

export const mapRecipeDataToWeb = (
  recipe: RecipeData,
  tags: RecipeTagData[]
): RecipeWeb => ({
  id: recipe.id,
  createdAt: recipe.createdAt,
  updatedAt: recipe.updatedAt,
  name: recipe.name,
  ingredients: recipe.ingredients.map(mapIngredientDataToWeb),
  tags: recipeTagIdsToRecipeTagsWeb(recipe.tags, tags),
  steps: recipe.steps,
  difficulty: recipe.difficulty,
  time: recipe.time,
  photos: recipe.photos ? mapPhotosDataToWeb(recipe.photos) : undefined
})
