import type { Recipe } from '../../types/recipe'

export const useRecipeStorage = () => useStorage<Recipe>('mongodb')
