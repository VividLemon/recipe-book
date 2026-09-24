/** Backwards-compatible accessors for server code outside repositories. */
import { useStorageRepositories } from '../storage/container'

export const useRecipeRepository = () => useStorageRepositories().recipes
export const useRecipeTagsRepository = () => useStorageRepositories().recipeTags
export const usePhotoFiles = () => useStorageRepositories().photos
