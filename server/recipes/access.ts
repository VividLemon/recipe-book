import type { RecipeData } from '../../types/recipe'

export const canAccessRecipe = (recipe: RecipeData, userId?: string) =>
  recipe.isPublic !== false || (!!userId && recipe.ownerId === userId)

export const canManageRecipe = (recipe: RecipeData, userId: string) =>
  !!recipe.ownerId && recipe.ownerId === userId
