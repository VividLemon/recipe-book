import type { RecipeTagData } from './types'
import { useStorageRepositories } from '../storage/container'
import { DocumentRepository } from '../storage/repositories'
import type { DocumentEngine } from '../storage/contracts'

export const createRecipeTagRepository = (engine: DocumentEngine<RecipeTagData>) =>
  new DocumentRepository<RecipeTagData>(engine)

export const useRecipeTagsRepository = () => useStorageRepositories().recipeTags
