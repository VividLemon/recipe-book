import { useStorageAsync } from '@vueuse/core'
import { toRef, toValue, watch, type MaybeRefOrGetter } from 'vue'

const databaseName = 'recipe-book-offline'
const databaseVersion = 1
const recipeStore = 'recipes'
const imageStore = 'images'

let database: IDBDatabase | undefined

const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  if (database) return resolve(database)
  const request = indexedDB.open(databaseName, databaseVersion)
  request.onupgradeneeded = () => {
    request.result.createObjectStore(recipeStore)
    request.result.createObjectStore(imageStore)
  }
  request.onsuccess = () => {
    database = request.result
    database.onclose = () => { database = undefined }
    resolve(database)
  }
  request.onerror = () => reject(request.error)
})

const run = <T>(store: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>) =>
  open().then(db => new Promise<T>((resolve, reject) => {
    const request = operation(db.transaction(store, mode).objectStore(store))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }))

export const useIndexedDB = <T>(key: MaybeRefOrGetter<string>, initialValue: T) => {
  const keyRef = toRef(key)
  const storage = {
    getItem: async () => {
      const stored = await run<unknown>(recipeStore, 'readonly', store => store.get(toValue(keyRef)))
      return stored == null ? null : JSON.stringify(stored)
    },
    setItem: async (_key: string, value: string) => {
      await run(recipeStore, 'readwrite', store => store.put(JSON.parse(value), toValue(keyRef)))
    },
    removeItem: async () => {
      await run(recipeStore, 'readwrite', store => store.delete(toValue(keyRef)))
    }
  }
  const value = useStorageAsync<T>('reactive-key', initialValue, storage, {
    writeDefaults: true,
    serializer: {
      read: raw => JSON.parse(raw) as T,
      write: value => JSON.stringify(value)
    }
  })
  watch(keyRef, async () => {
    const stored = await storage.getItem()
    value.value = stored == null ? initialValue : JSON.parse(stored) as T
  })

  const putImage = async (imageKey: string, blob: Blob) => {
    await run(imageStore, 'readwrite', store => store.put(blob, imageKey))
  }
  const getImage = (imageKey: string) => run<Blob | undefined>(
    imageStore,
    'readonly',
    store => store.get(imageKey)
  )
  const removeImage = async (imageKey: string) => {
    await run(imageStore, 'readwrite', store => store.delete(imageKey))
  }
  const close = () => {
    database?.close()
    database = undefined
  }

  return {
    value,
    putImage,
    getImage,
    removeImage,
    close
  }
}
