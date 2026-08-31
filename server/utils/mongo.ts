import type { RecipeData, RecipeTagData } from '../../types/recipe'

export const useRecipeStorage = () => useStorage<Recipe>('recipes')
export const useRecipeTagsStorage = () => useStorage<RecipeTag>('recipeTags')
