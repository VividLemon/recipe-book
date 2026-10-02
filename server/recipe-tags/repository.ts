import { useStorageRepositories } from '../storage/container'

export const useRecipeTagsRepository = () => useStorageRepositories().recipeTags
