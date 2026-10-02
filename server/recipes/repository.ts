import { useStorageRepositories } from '../storage/container'

export const useRecipeRepository = () => useStorageRepositories().recipes
