import type { RecipeData } from '../recipes/types'
import type { RecipeTagData } from '../recipe-tags/types'
import type { UserData } from '../users/types'
import { FilesystemDocumentEngine } from './documents/filesystem'
import { MemoryDocumentEngine } from './documents/memory'
import { FilesystemFileEngine } from './filesystem'
import { MemoryFileEngine } from './memory-file'
import { DocumentRepository, type StorageRepositories } from './repositories'
import type { DocumentEngine, FileEngine } from './contracts'
import { StorageError } from './contracts'
import { MongoClient } from 'mongodb'
import { MongoDocumentEngine } from './documents/mongo'

export interface StorageContainerOptions {
  documentBackend?: 'filesystem' | 'memory' | 'mongodb'
  fileBackend?: 'filesystem' | 'memory'
  directory?: string
  documents?: {
    recipes?: DocumentEngine<RecipeData>
    recipeTags?: DocumentEngine<RecipeTagData>
    users?: DocumentEngine<UserData>
  }
  photos?: FileEngine
  mongodb?: MongoStorageOptions
}

export interface MongoStorageOptions {
  uri: string
  database: string
  recipesCollection?: string
  recipeTagsCollection?: string
  usersCollection?: string
}

let repositories: StorageRepositories | undefined
let mongoClient: MongoClient | undefined

export const createStorageRepositories = (options: StorageContainerOptions = {}) => {
  const {
    documentBackend = process.env.NODE_ENV === 'test' ? 'memory' : 'filesystem',
    fileBackend = process.env.NODE_ENV === 'test' ? 'memory' : 'filesystem',
    directory = './.data'
  } = options
  if (documentBackend === 'mongodb' && (!options.documents?.recipes || !options.documents.recipeTags || !options.documents.users)) {
    throw new StorageError('configuration', 'MongoDB document engines must be composed before creating repositories')
  }
  const documentEngines = {
    memory: () => ({
      recipes: new MemoryDocumentEngine<RecipeData>(),
      recipeTags: new MemoryDocumentEngine<RecipeTagData>(),
      users: new MemoryDocumentEngine<UserData>()
    }),
    filesystem: () => ({
      recipes: new FilesystemDocumentEngine<RecipeData>(`${directory}/recipes`),
      recipeTags: new FilesystemDocumentEngine<RecipeTagData>(`${directory}/recipeTags`),
      users: new FilesystemDocumentEngine<UserData>(`${directory}/users`)
    }),
    mongodb: () => options.documents!
  } as const
  const { recipes: recipeEngine, recipeTags: tagEngine, users: userEngine } = documentEngines[documentBackend]()
  const fileEngines = {
    memory: () => new MemoryFileEngine(),
    filesystem: () => new FilesystemFileEngine(`${directory}/photos`)
  } as const
  const recipes = new DocumentRepository<RecipeData>(recipeEngine!)
  const tags = new DocumentRepository<RecipeTagData>(tagEngine!)
  const users = new DocumentRepository<UserData>(userEngine!)
  const photos = options.photos ?? fileEngines[fileBackend]()
  return { recipes, recipeTags: tags, users, photos }
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
      recipes: new MongoDocumentEngine(
        database.collection<RecipeData & { _id: string }>(
          options.mongodb.recipesCollection ?? 'recipes'
        )
      ),
      users: new MongoDocumentEngine(
        database.collection<UserData & { _id: string }>(
          options.mongodb.usersCollection ?? 'users'
        )
      ),
      recipeTags: new MongoDocumentEngine(
        database.collection<RecipeTagData & { _id: string }>(
          options.mongodb.recipeTagsCollection ?? 'recipeTags'
        )
      )
    }
  })
}

export const configureStorage = (options: StorageContainerOptions = {}) => {
  repositories = createStorageRepositories(options)
  return repositories
}

export const useStorageRepositories = () => repositories ?? configureStorage()
