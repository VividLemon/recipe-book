import type { ReadRecipeResponse } from '../types/recipe'

export const useFormattedRecipe = (
  recipes: MaybeRefOrGetter<ReadRecipeResponse>
) =>
  computed(() =>
    toValue(recipes).map((recipe) => ({
      ...recipe,
      time: formatedTime(recipe.time)
    }))
  )
