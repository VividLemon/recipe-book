import fsDriver from 'unstorage/drivers/fs'
import memoryDriver from 'unstorage/drivers/memory'
import s3Driver from 'unstorage/drivers/s3'

// Namespaces that are mounted with the environment-selected driver below.
// Both `server/utils/storage/data.ts` and `server/utils/storage/photos.ts`
// only ever call `useStorage('<namespace>')` - they never know or care which
// driver actually backs a given namespace, so a new implementation (e.g. an
// S3 bucket in production, in-memory storage in CI) is a config-only change.
const storageNamespaces = ['recipes', 'recipeTags', 'photos'] as const

export default defineNitroPlugin(async () => {
  const storage = useStorage()
  const config = useRuntimeConfig()

  const driverFor = async (namespace: (typeof storageNamespaces)[number]) => {
    switch (config.storageDriver) {
      case 'memory':
        return memoryDriver()
      case 's3':
        return s3Driver(config.s3)
      case 'fs':
      default:
        return fsDriver({ base: `${config.storageDir}/${namespace}` })
    }
  }

  await Promise.all(
    storageNamespaces.map(async (namespace) => {
      storage.mount(namespace, await driverFor(namespace))
    })
  )
})
