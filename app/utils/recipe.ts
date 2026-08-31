import type { RecipeTag } from '../../types/recipe.ts'

const createRecipeTagFallback = (): RecipeTag => ({
  createdAt: Date.now(),
  id: '',
  text: '',
  variant: undefined
})
export const recipeTagIdToRecipeTag = (ids: string[], tags: RecipeTag[]) =>
  ids.map((tagId) => tags.find((tag) => tag.id === tagId) || createRecipeTagFallback())
