import type { ListRecipesApiQuery, RecipePageResponse, RecipeWeb } from '../../types/recipe'
import { recipeMatchesQuery } from '~/queries/recipeCache'

const storagePrefix = 'recipe-book:offline-recipes:'
const cachePrefix = 'recipe-book:offline-photos:'
const objectUrls = new Map<string, string>()

const imageUrls = (recipe: RecipeWeb) => [
  recipe.photos?.coverImage?.default,
  recipe.photos?.coverImage?.thumbnail
]
  .flatMap((variants) => variants ? Object.values(variants) : [])
  .concat(recipe.photos?.stepsImages ?? [])

export const useOfflineRecipes = () => {
  const { user } = useUserSession()
  const scope = () => user.value?.id ?? 'guest'
  const storageKey = () => `${storagePrefix}${scope()}`
  const cacheName = () => `${cachePrefix}${scope()}`

  const read = (): RecipeWeb[] => {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) ?? '[]') as RecipeWeb[]
    } catch {
      return []
    }
  }

  const write = (recipes: RecipeWeb[]) =>
    localStorage.setItem(storageKey(), JSON.stringify(recipes))

  const cachePhotos = async (recipe: RecipeWeb) => {
    if (!('caches' in window)) return
    const cache = await caches.open(cacheName())
    await Promise.all(imageUrls(recipe).map(async (url) => {
      if (await cache.match(url)) return
      try {
        const response = await fetch(url)
        if (response.ok) await cache.put(url, response)
      } catch {
        // Recipe data remains available when a specific image cannot be saved.
      }
    }))
  }

  const cacheRecipe = async (recipe: RecipeWeb) => {
    const recipes = read()
    const index = recipes.findIndex(({ id }) => id === recipe.id)
    if (index === -1) recipes.push(recipe)
    else recipes[index] = recipe
    write(recipes)
    await cachePhotos(recipe)
  }

  const cachePage = async (page: RecipePageResponse) => {
    for (const recipe of page.items) await cacheRecipe(recipe)
  }

  const hydrateRecipe = async (recipe: RecipeWeb): Promise<RecipeWeb> => {
    if (!('caches' in window)) return recipe
    const cache = await caches.open(cacheName())
    const replacements = new Map<string, string>()
    await Promise.all(imageUrls(recipe).map(async (url) => {
      const response = await cache.match(url)
      if (!response) return
      let objectUrl = objectUrls.get(`${scope()}:${url}`)
      if (!objectUrl) {
        objectUrl = URL.createObjectURL(await response.blob())
        objectUrls.set(`${scope()}:${url}`, objectUrl)
      }
      replacements.set(url, objectUrl)
    }))
    const replace = (url: string) => replacements.get(url) ?? url
    const variants = (value?: Record<string, string>) =>
      value && Object.fromEntries(Object.entries(value).map(([key, url]) => [key, replace(url)]))
    return {
      ...recipe,
      photos: recipe.photos && {
        ...recipe.photos,
        coverImage: recipe.photos.coverImage && {
          default: variants(recipe.photos.coverImage.default) as typeof recipe.photos.coverImage.default,
          thumbnail: variants(recipe.photos.coverImage.thumbnail) as typeof recipe.photos.coverImage.thumbnail
        },
        stepsImages: recipe.photos.stepsImages?.map(replace)
      },
      steps: [...replacements].reduce(
        (steps, [url, objectUrl]) => steps.replaceAll(url, objectUrl),
        recipe.steps
      )
    }
  }

  const getRecipe = async (id: string) => {
    const recipe = read().find((item) => item.id === id)
    return recipe ? hydrateRecipe(recipe) : null
  }

  const getPage = async (query: ListRecipesApiQuery): Promise<RecipePageResponse> => {
    const filtered = read().filter((recipe) => recipeMatchesQuery(recipe, query))
    const order = query.order === 'asc' ? 1 : -1
    const sort = query.sort
    if (sort && sort !== 'favorite') {
      filtered.sort((left, right) => {
        const a = left[sort]
        const b = right[sort]
        return (typeof a === 'string' ? a.localeCompare(String(b)) : Number(a) - Number(b)) * order
      })
    }
    const pageSize = query.pageSize ?? 12
    const page = query.page ?? 1
    const total = filtered.length
    const items = await Promise.all(filtered.slice((page - 1) * pageSize, page * pageSize).map(hydrateRecipe))
    return { items, total, page, pageSize, nextPage: page * pageSize < total ? page + 1 : null }
  }

  const clear = async () => {
    localStorage.removeItem(storageKey())
    await caches.delete(cacheName())
  }

  return { cachePage, cacheRecipe, clear, getPage, getRecipe }
}
