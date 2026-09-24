import type { RecipeData } from './types'
import { useRecipeRepository } from './repository'
import { deletePhotos, deleteRecipePhotos, listRemovedRecipePhotoUrls } from '../photos/operations'

export const getAllRecipes = async (): Promise<RecipeData[]> =>
  useRecipeRepository().list()

export const getRecipe = async (id: string) =>
  useRecipeRepository().get(id)

export const createRecipe = async (recipe: RecipeData) =>
  useRecipeRepository().set(recipe)

export const updateRecipe = async (recipe: RecipeData) =>
  useRecipeRepository().set(recipe)

export const deleteRecipe = async (id: string) =>
  useRecipeRepository().remove(id)

export const addStepPhoto = async (recipe: RecipeData, photo: string) =>
  updateRecipe({
    ...recipe,
    photos: {
      ...recipe.photos,
      stepsImages: [...(recipe.photos?.stepsImages ?? []), photo]
    }
  })

export const cleanupRecipePhotos = (id: string) => deleteRecipePhotos(id)

export const cleanupReplacedRecipePhotos = (previous: RecipeData, next: RecipeData) =>
  deletePhotos(listRemovedRecipePhotoUrls({ previous, next }))
