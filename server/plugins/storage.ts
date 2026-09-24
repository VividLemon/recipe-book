import { configureStorage, configureStorageWithMongo } from '../storage/container'

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
    await configureStorageWithMongo({
      ...options,
      mongodb: {
        uri: mongodb.uri,
        database: mongodb.database,
        recipesCollection: mongodb.recipesCollection,
        recipeTagsCollection: mongodb.recipeTagsCollection
      }
    })
    return
  }
  configureStorage(options)
})
