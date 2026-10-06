import type { RecipeData } from '../../types/recipe'
import { listImageVariantUrls } from '../../app/utils/photoVariants'

const photoUrls = (recipe: RecipeData) => new Set([
  ...listImageVariantUrls(recipe.photos?.coverImage?.default),
  ...listImageVariantUrls(recipe.photos?.coverImage?.thumbnail),
  ...(recipe.photos?.stepsImages ?? [])
])

export const canAccessPhoto = (recipes: RecipeData[], photoUrl: string, userId?: string) => {
  const owners = recipes.filter((recipe) => photoUrls(recipe).has(photoUrl))
  return !owners.length
    || owners.some((recipe) => recipe.isPublic !== false)
    || owners.some((recipe) => !!userId && recipe.ownerId === userId)
}

export const isPhotoPublic = (recipes: RecipeData[], photoUrl: string) => {
  const owners = recipes.filter((recipe) => photoUrls(recipe).has(photoUrl))
  return !owners.length || owners.some((recipe) => recipe.isPublic !== false)
}
