import type {
  RecipePageResponse,
  RecipeWeb
} from '../../types/recipe'

const databaseName = 'recipe-book-offline'
const databaseVersion = 1
const recipeStore = 'recipes'
const imageStore = 'images'

const storageKey = (userId: string | undefined) => userId || 'public'
const imageKey = (scope: string, url: string) => `${scope}:${url}`

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(databaseName, databaseVersion)
  request.onupgradeneeded = () => {
    request.result.createObjectStore(recipeStore)
    request.result.createObjectStore(imageStore)
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const request = <T>(transaction: IDBObjectStore, key: IDBValidKey) =>
  new Promise<T | undefined>((resolve, reject) => {
    const operation = transaction.get(key)
    operation.onsuccess = () => resolve(operation.result as T | undefined)
    operation.onerror = () => reject(operation.error)
  })

const put = (transaction: IDBObjectStore, value: unknown, key: IDBValidKey) =>
  new Promise<void>((resolve, reject) => {
    const operation = transaction.put(value, key)
    operation.onsuccess = () => resolve()
    operation.onerror = () => reject(operation.error)
  })

const remove = (transaction: IDBObjectStore, key: IDBValidKey) =>
  new Promise<void>((resolve, reject) => {
    const operation = transaction.delete(key)
    operation.onsuccess = () => resolve()
    operation.onerror = () => reject(operation.error)
  })

const readRecipes = async (scope: string) => {
  const database = await openDatabase()
  const transaction = database.transaction(recipeStore, 'readonly')
  const recipes = await new Promise<RecipeWeb[]>((resolve, reject) => {
    const store = transaction.objectStore(recipeStore)
    const keys = store.getAllKeys()
    const values = store.getAll()
    let loadedKeys: IDBValidKey[] | undefined
    let loadedValues: RecipeWeb[] | undefined
    const finish = () => {
      if (loadedKeys && loadedValues) {
        resolve(loadedValues.filter((_recipe, index) =>
          String(loadedKeys![index]).startsWith(`${scope}:`)
        ))
      }
    }
    keys.onsuccess = () => {
      loadedKeys = keys.result
      finish()
    }
    values.onsuccess = () => {
      loadedValues = values.result as RecipeWeb[]
      finish()
    }
    keys.onerror = () => reject(keys.error)
    values.onerror = () => reject(values.error)
  })
  database.close()
  return recipes || []
}

const imageUrls = (recipe: RecipeWeb) => {
  const variants = recipe.photos?.coverImage
  return [
    ...(variants ? Object.values(variants).flatMap(Object.values) : []),
    ...(recipe.photos?.stepsImages || [])
  ]
}

const restoreImage = async (scope: string, url: string) => {
  const database = await openDatabase()
  const transaction = database.transaction(imageStore, 'readonly')
  const blob = await request<Blob>(transaction.objectStore(imageStore), imageKey(scope, url))
  database.close()
  return blob ? URL.createObjectURL(blob) : url
}

const restoreRecipe = async (scope: string, recipe: RecipeWeb): Promise<RecipeWeb> => {
  if (!recipe.photos) return recipe
  const urls = await Promise.all(imageUrls(recipe).map(url => restoreImage(scope, url)))
  let index = 0
  const nextUrl = () => urls[index++] || ''
  const coverImage = recipe.photos.coverImage
    ? {
        default: {
          original: nextUrl(),
          webp: nextUrl(),
          avif: nextUrl()
        },
        thumbnail: {
          original: nextUrl(),
          webp: nextUrl(),
          avif: nextUrl()
        }
      }
    : undefined
  const stepsImages = recipe.photos.stepsImages?.map(nextUrl)
  return {
    ...recipe,
    photos: {
      ...recipe.photos,
      coverImage,
      stepsImages
    }
  }
}

export const useOfflineRecipes = () => {
  const { user } = useUserSession()
  const online = useOnline()
  const recipes = shallowRef<RecipeWeb[]>([])
  const scope = computed(() => storageKey(user.value?.id))
  let objectUrls: string[] = []

  const revokeObjectUrls = () => {
    objectUrls.forEach(url => URL.revokeObjectURL(url))
    objectUrls = []
  }

  const load = async () => {
    if (!import.meta.client) return
    revokeObjectUrls()
    const stored = await readRecipes(scope.value).catch(() => [])
    const restored = await Promise.all(stored.map(recipe => restoreRecipe(scope.value, recipe)))
    objectUrls = restored.flatMap(recipe => imageUrls(recipe).filter(url => url.startsWith('blob:')))
    recipes.value = restored
  }

  const savePage = async (page: RecipePageResponse) => {
    if (!import.meta.client) return
    const database = await openDatabase()
    const transaction = database.transaction(recipeStore, 'readwrite')
    await Promise.all(page.items.map(recipe => put(
      transaction.objectStore(recipeStore),
      recipe,
      `${scope.value}:${recipe.id}`
    )))
    database.close()
    await load()

    await Promise.all(page.items.flatMap(recipe => imageUrls(recipe)).map(async url => {
      try {
        const response = await fetch(url)
        if (!response.ok) return
        const imageDatabase = await openDatabase()
        const imageTransaction = imageDatabase.transaction(imageStore, 'readwrite')
        await put(imageTransaction.objectStore(imageStore), await response.blob(), imageKey(scope.value, url))
        imageDatabase.close()
      } catch {
        // The recipe remains available when an individual image cannot be cached.
      }
    }))
    await load()
  }

  const clear = async () => {
    if (!import.meta.client) return
    const stored = await readRecipes(scope.value).catch(() => [])
    const database = await openDatabase()
    const transaction = database.transaction([recipeStore, imageStore], 'readwrite')
    const recipesStore = transaction.objectStore(recipeStore)
    const imagesStore = transaction.objectStore(imageStore)
    await Promise.all(stored.flatMap(recipe => imageUrls(recipe)).map(url =>
      remove(imagesStore, imageKey(scope.value, url))
    ))
    await Promise.all(stored.map(recipe => remove(recipesStore, `${scope.value}:${recipe.id}`)))
    database.close()
    revokeObjectUrls()
    recipes.value = []
  }

  watch(() => user.value?.id, () => {
    void load()
  }, { immediate: true })

  return {
    items: computed(() => import.meta.client && !online.value ? recipes.value : []),
    savePage,
    clear,
    isOffline: computed(() => import.meta.client && !online.value)
  }
}
