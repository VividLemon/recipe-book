import fsDriver from 'unstorage/drivers/fs'
import memoryDriver from 'unstorage/drivers/memory'

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
      case 's3': {
        // Imported lazily so the (optional) `aws4fetch` peer dependency is
        // only required when the s3 driver is actually selected.
        const { default: s3Driver } = await import('unstorage/drivers/s3')
        return s3Driver({ base: namespace, ...config.s3 })
      }
      case 'fs':
      default:
        return fsDriver({ base: `${config.storageDir}/${namespace}` })
    }
  }

  for (const namespace of storageNamespaces) {
    storage.mount(namespace, await driverFor(namespace))
  }
})

