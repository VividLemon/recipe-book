import type { RecipeData } from './types'
import { useStorageRepositories } from '../storage/container'
import { DocumentRepository } from '../storage/repositories'
import type { DocumentEngine } from '../storage/contracts'

export const createRecipeRepository = (engine: DocumentEngine<RecipeData>) =>
  new DocumentRepository<RecipeData>(engine)

export const useRecipeRepository = () => useStorageRepositories().recipes
