import type { RecipeData } from '../../types/recipe'
import { listImageVariantUrls } from '../../app/utils/photoVariants'

const photoUrls = (recipe: RecipeData) => [
  ...listImageVariantUrls(recipe.photos?.coverImage?.default),
  ...listImageVariantUrls(recipe.photos?.coverImage?.thumbnail),
  ...(recipe.photos?.stepsImages ?? [])
]

export const canAccessPhoto = (recipes: RecipeData[], photoUrl: string, userId?: string) => {
  const owners = recipes.filter((recipe) => photoUrls(recipe).includes(photoUrl))
  return !owners.length
    || owners.some((recipe) => recipe.isPublic !== false)
    || owners.some((recipe) => !!userId && recipe.ownerId === userId)
}

export const isPhotoPublic = (recipes: RecipeData[], photoUrl: string) =>
  !recipes.some((recipe) => photoUrls(recipe).includes(photoUrl))
    || recipes.some((recipe) => photoUrls(recipe).includes(photoUrl) && recipe.isPublic !== false)
