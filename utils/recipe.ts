import type { RecipeTag } from '../types/recipe'

const recipeTagFallback = Object.freeze({
  createdAt: Date.now(),
  id: '',
  text: '',
  variant: undefined
} as RecipeTag)
export const recipeTagIdToRecipeTag = (ids: string[], tags: RecipeTag[]) =>
  ids.map((tagId) => tags.find((tag) => tag.id === tagId) || recipeTagFallback)
