import fsDriver from 'unstorage/drivers/fs'
import memoryDriver from 'unstorage/drivers/memory'
import s3Driver from 'unstorage/drivers/s3'

const storageNamespaces = ['recipes', 'recipeTags', 'photos'] as const

export default defineNitroPlugin(async () => {
  const storage = useStorage()
  const config = useRuntimeConfig()

  const driverFor = (namespace: (typeof storageNamespaces)[number]) => {
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

  storageNamespaces.forEach((namespace) => {
    storage.mount(namespace, driverFor(namespace))
  })
})
