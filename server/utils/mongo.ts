import type { RecipeData, RecipeTagData } from '../../types/recipe'

export const useRecipeStorage = () => useStorage<RecipeData>('recipes')
export const useRecipeTagsStorage = () => useStorage<RecipeTagData>('recipeTags')
