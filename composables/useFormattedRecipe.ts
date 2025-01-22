import type { ReadRecipeResponse } from '../types/recipe'

export const mapRecipeToHumanReadable = (
  recipe: ReadRecipeResponse[number]
) => ({
  ...recipe,
  time: formatTimeToHumanReadable(recipe.time)
})

export const useFormattedRecipe = (
  recipes: MaybeRefOrGetter<ReadRecipeResponse>
) => computed(() => toValue(recipes).map(mapRecipeToHumanReadable))
