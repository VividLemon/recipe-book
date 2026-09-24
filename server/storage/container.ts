import type { RecipeData } from '../recipes/types'
import type { RecipeTagData } from '../recipe-tags/types'
import { FilesystemDocumentEngine } from './documents/filesystem'
import { MemoryDocumentEngine } from './documents/memory'
import { FilesystemFileEngine } from './filesystem'
import { MemoryFileEngine } from './memory-file'
import type { StorageRepositories } from './repositories'
import type { DocumentEngine, FileEngine } from './contracts'
import { StorageError } from './contracts'
import { createRecipeRepository } from '../recipes/repository'
import { createRecipeTagRepository } from '../recipe-tags/repository'
import { MongoClient } from 'mongodb'
import { MongoDocumentEngine } from './documents/mongo'

export interface StorageContainerOptions {
  documentBackend?: 'filesystem' | 'memory' | 'mongodb'
  fileBackend?: 'filesystem' | 'memory'
  directory?: string
  documents?: {
    recipes?: DocumentEngine<RecipeData>
    recipeTags?: DocumentEngine<RecipeTagData>
  }
  photos?: FileEngine
  mongodb?: MongoStorageOptions
}

export interface MongoStorageOptions {
  uri: string
  database: string
  recipesCollection?: string
  recipeTagsCollection?: string
}

let repositories: StorageRepositories | undefined
let mongoClient: MongoClient | undefined

export const createStorageRepositories = (options: StorageContainerOptions = {}) => {
  const {
    documentBackend = process.env.NODE_ENV === 'test' ? 'memory' : 'filesystem',
    fileBackend = process.env.NODE_ENV === 'test' ? 'memory' : 'filesystem',
    directory = './.data'
  } = options
  if (documentBackend === 'mongodb' && (!options.documents?.recipes || !options.documents.recipeTags)) {
    throw new StorageError('configuration', 'MongoDB document engines must be composed before creating repositories')
  }
  const documentEngines = {
    memory: () => ({
      recipes: new MemoryDocumentEngine<RecipeData>(),
      recipeTags: new MemoryDocumentEngine<RecipeTagData>()
    }),
    filesystem: () => ({
      recipes: new FilesystemDocumentEngine<RecipeData>(`${directory}/recipes`),
      recipeTags: new FilesystemDocumentEngine<RecipeTagData>(`${directory}/recipeTags`)
    }),
    mongodb: () => options.documents!
  } as const
  const { recipes: recipeEngine, recipeTags: tagEngine } = documentEngines[documentBackend]()
  const fileEngines = {
    memory: () => new MemoryFileEngine(),
    filesystem: () => new FilesystemFileEngine(`${directory}/photos`)
  } as const
  const recipes = createRecipeRepository(recipeEngine)
  const tags = createRecipeTagRepository(tagEngine)
  const photos = options.photos ?? fileEngines[fileBackend]()
  return { recipes, recipeTags: tags, photos }
}

export const configureStorageWithMongo = async (
  options: Omit<StorageContainerOptions, 'documents'> & { mongodb: MongoStorageOptions }
) => {
  mongoClient ??= new MongoClient(options.mongodb.uri)
  if (!mongoClient) throw new StorageError('configuration', 'Could not create MongoDB client')
  await mongoClient.connect()
  const database = mongoClient.db(options.mongodb.database)
  return configureStorage({
    ...options,
    documents: {
      recipes: new MongoDocumentEngine(database.collection(options.mongodb.recipesCollection ?? 'recipes') as any),
      recipeTags: new MongoDocumentEngine(database.collection(options.mongodb.recipeTagsCollection ?? 'recipeTags') as any)
    }
  })
}

export const configureStorage = (options: StorageContainerOptions = {}) => {
  repositories = createStorageRepositories(options)
  return repositories
}

export const useStorageRepositories = () => repositories ?? configureStorage()
