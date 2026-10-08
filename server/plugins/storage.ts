import { configureStorage, configureStorageWithMongo } from '../storage/container'
import { useRecipeRepository } from '../recipes/repository'
import { useUserRepository } from '../users/repository'
import { consola } from 'consola'

const assignLegacyRecipeOwner = async (ownerId: string | undefined) => {
  if (!ownerId) return
  if (!await useUserRepository().findOne({ id: ownerId })) {
    consola.warn(`legacyRecipeOwnerId ${ownerId} does not match any account; ownerless recipes were not assigned`)
    return
  }
  await useRecipeRepository().updateMany({ ownerId: { $exists: false } } as never, { ownerId })
}

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const documentBackend = config.documentBackend as 'filesystem' | 'memory' | 'mongodb'
  const options = {
    documentBackend,
    fileBackend: config.fileBackend as 'filesystem' | 'memory',
    directory: config.storageDir as string
  } as Parameters<typeof configureStorage>[0]

  if (documentBackend === 'mongodb') {
    const mongodb = config.mongodb as { uri?: string; database?: string; recipesCollection?: string; recipeTagsCollection?: string; usersCollection?: string }
    if (!mongodb?.uri || !mongodb.database) throw new Error('MongoDB document backend requires mongodb.uri and mongodb.database')
    await configureStorageWithMongo({
      ...options,
      mongodb: {
        uri: mongodb.uri,
        database: mongodb.database,
        recipesCollection: mongodb.recipesCollection,
        recipeTagsCollection: mongodb.recipeTagsCollection,
        usersCollection: mongodb.usersCollection
      }
    })
    await assignLegacyRecipeOwner(config.legacyRecipeOwnerId as string | undefined)
    return
  }
  configureStorage(options)
  await assignLegacyRecipeOwner(config.legacyRecipeOwnerId as string | undefined)
})
