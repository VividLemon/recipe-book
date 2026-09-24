import type { RecipeData } from '../recipes/types'
import type { RecipeTagData } from '../recipe-tags/types'
import { FilesystemDocumentEngine } from './documents/filesystem'
import { MemoryDocumentEngine } from './documents/memory'
import { FilesystemFileEngine } from './filesystem'
import { MemoryFileEngine } from './memory-file'
import { DocumentRepository, type StorageRepositories } from './repositories'
import type { DocumentEngine, FileEngine } from './contracts'
import { createRecipeRepository } from '../recipes/repository'
import { createRecipeTagRepository } from '../recipe-tags/repository'

export interface StorageContainerOptions {
  documentBackend?: 'filesystem' | 'memory' | 'mongodb'
  fileBackend?: 'filesystem' | 'memory'
  directory?: string
  documents?: {
    recipes?: DocumentEngine<RecipeData>
    recipeTags?: DocumentEngine<RecipeTagData>
  }
  photos?: FileEngine
}

let repositories: StorageRepositories | undefined

export const createStorageRepositories = (options: StorageContainerOptions = {}) => {
  const {
    documentBackend = process.env.NODE_ENV === 'test' ? 'memory' : 'filesystem',
    fileBackend = process.env.NODE_ENV === 'test' ? 'memory' : 'filesystem',
    directory = './.data'
  } = options
  const memoryDocuments = documentBackend === 'memory'
  const memoryFiles = fileBackend === 'memory'
  const recipeEngine = options.documents?.recipes
      ?? (memoryDocuments ? new MemoryDocumentEngine<RecipeData>() : new FilesystemDocumentEngine<RecipeData>(`${directory}/recipes`))
  const tagEngine = options.documents?.recipeTags
      ?? (memoryDocuments ? new MemoryDocumentEngine<RecipeTagData>() : new FilesystemDocumentEngine<RecipeTagData>(`${directory}/recipeTags`))
  const recipes = createRecipeRepository(recipeEngine)
  const tags = createRecipeTagRepository(tagEngine)
  const photos = options.photos
    ?? (memoryFiles ? new MemoryFileEngine() : new FilesystemFileEngine(`${directory}/photos`))
  return { recipes, recipeTags: tags, photos }
}

export const configureStorage = (options: StorageContainerOptions = {}) => {
  repositories = createStorageRepositories(options)
  return repositories
}

export const useStorageRepositories = () => repositories ?? configureStorage()
