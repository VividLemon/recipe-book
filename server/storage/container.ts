import type { RecipeData, RecipeTagData } from '../../types/recipe'
import { FilesystemDocumentEngine } from './documents/filesystem'
import { MemoryDocumentEngine } from './documents/memory'
import { FilesystemFileEngine } from './filesystem'
import { MemoryFileEngine } from './memory-file'
import { DocumentRepository, type StorageRepositories } from './repositories'
import type { DocumentEngine, FileEngine } from './contracts'

export interface StorageContainerOptions {
  driver?: 'fs' | 'memory'
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
    driver = process.env.NODE_ENV === 'test' ? 'memory' : 'fs',
    directory = './.data'
  } = options
  const memory = driver === 'memory'
  const recipes = new DocumentRepository<RecipeData>(
    options.documents?.recipes
      ?? (memory ? new MemoryDocumentEngine<RecipeData>() : new FilesystemDocumentEngine<RecipeData>(`${directory}/recipes`))
  )
  const tags = new DocumentRepository<RecipeTagData>(
    options.documents?.recipeTags
      ?? (memory ? new MemoryDocumentEngine<RecipeTagData>() : new FilesystemDocumentEngine<RecipeTagData>(`${directory}/recipeTags`))
  )
  const photos = options.photos
    ?? (memory ? new MemoryFileEngine() : new FilesystemFileEngine(`${directory}/photos`))
  return { recipes, recipeTags: tags, photos }
}

export const configureStorage = (options: StorageContainerOptions = {}) => {
  repositories = createStorageRepositories(options)
  return repositories
}

export const useStorageRepositories = () => repositories ?? configureStorage()
