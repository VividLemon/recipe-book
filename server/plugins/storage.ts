import { configureStorage } from '../storage/container'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  configureStorage({
    driver: config.storageDriver as 'fs' | 'memory',
    directory: config.storageDir as string
  })
})
