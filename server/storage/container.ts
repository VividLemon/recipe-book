import type { RecipeData, RecipeTagData } from '../../types/recipe'
import { FilesystemDocumentEngine } from './documents/filesystem'
import { MemoryDocumentEngine } from './documents/memory'
import { FilesystemFileEngine } from './filesystem'
import { MemoryFileEngine } from './memory-file'
import { DocumentRepository, type StorageRepositories } from './repositories'
import type { DocumentEngine, FileEngine } from './contracts'

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
  const recipes = new DocumentRepository<RecipeData>(
    options.documents?.recipes
      ?? (memoryDocuments ? new MemoryDocumentEngine<RecipeData>() : new FilesystemDocumentEngine<RecipeData>(`${directory}/recipes`))
  )
  const tags = new DocumentRepository<RecipeTagData>(
    options.documents?.recipeTags
      ?? (memoryDocuments ? new MemoryDocumentEngine<RecipeTagData>() : new FilesystemDocumentEngine<RecipeTagData>(`${directory}/recipeTags`))
  )
  const photos = options.photos
    ?? (memoryFiles ? new MemoryFileEngine() : new FilesystemFileEngine(`${directory}/photos`))
  return { recipes, recipeTags: tags, photos }
}

export const configureStorage = (options: StorageContainerOptions = {}) => {
  repositories = createStorageRepositories(options)
  return repositories
}

export const useStorageRepositories = () => repositories ?? configureStorage()
