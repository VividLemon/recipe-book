import mongodb from 'unstorage/drivers/mongodb'

export default defineNitroPlugin(() => {
  const storage = useStorage()
  const { mongo } = useRuntimeConfig()

  Object.entries(mongo).forEach(([key, value]) => {
    storage.mount(key, mongodb(value))
  })
})
