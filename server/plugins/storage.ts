import { configureStorage } from '../storage/container'
import { MongoClient } from 'mongodb'
import { MongoDocumentEngine } from '../storage/documents/mongo'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const documentBackend = config.documentBackend as 'filesystem' | 'memory' | 'mongodb'
  const options = {
    documentBackend,
    fileBackend: config.fileBackend as 'filesystem' | 'memory',
    directory: config.storageDir as string
  } as Parameters<typeof configureStorage>[0]

  if (documentBackend === 'mongodb') {
    const mongodb = config.mongodb as { uri?: string; database?: string; recipesCollection?: string; recipeTagsCollection?: string }
    if (!mongodb?.uri || !mongodb.database) throw new Error('MongoDB document backend requires mongodb.uri and mongodb.database')
    const client = new MongoClient(mongodb.uri)
    await client.connect()
    const database = client.db(mongodb.database)
    options.documents = {
      recipes: new MongoDocumentEngine(database.collection(mongodb.recipesCollection ?? 'recipes') as any),
      recipeTags: new MongoDocumentEngine(database.collection(mongodb.recipeTagsCollection ?? 'recipeTags') as any)
    }
  }
  configureStorage(options)
})
