import { useMutation, useQueryCache } from '@pinia/colada'
import type {
  ReadRecipePageResponse,
  RecipeWeb
} from '../../types/recipe'

interface InfiniteRecipeData {
  pages: ReadRecipePageResponse[]
  pageParams: unknown[]
}

interface CreateRecipeVariables {
  body: FormData
  optimisticRecipe: RecipeWeb
}

interface UpdateRecipeVariables extends CreateRecipeVariables {
  id: string
}

interface DeleteRecipeVariables {
  id: string
}

export const useRecipeMutations = () => {
  const queryCache = useQueryCache()
  const { hasFavorite } = useFavoriteRecipe()
  type CacheEntry = ReturnType<typeof queryCache.getEntries>[number]
  type CacheSnapshot = {
    key: CacheEntry['key']
    before: InfiniteRecipeData
    optimistic: InfiniteRecipeData
  }

  const updateLists = (
    update: (
      data: InfiniteRecipeData,
      key: unknown[]
    ) => InfiniteRecipeData | undefined
  ): CacheSnapshot[] => {
    const snapshots: CacheSnapshot[] = []
    for (const entry of queryCache.getEntries({
      key: ['recipes'],
      status: 'success'
    })) {
      const before = entry.state.value.data as InfiniteRecipeData | undefined
      if (!before?.pages.length) continue
      const optimistic = update(before, entry.key as unknown[])
      if (!optimistic) continue
      queryCache.setQueryData(entry.key, optimistic)
      snapshots.push({ key: entry.key, before, optimistic })
    }
    return snapshots
  }

  const rollbackLists = (snapshots: CacheSnapshot[] = []) => {
    for (const { key, before, optimistic } of snapshots) {
      if (queryCache.getQueryData(key) === optimistic) {
        queryCache.setQueryData(key, before)
      }
    }
  }

  const matchesList = (key: unknown[], recipe: RecipeWeb) => {
    const [, name, tagId, difficulty] = key
    return (
      (typeof name !== 'string' ||
        !name ||
        recipe.name.toLocaleLowerCase().includes(name.toLocaleLowerCase())) &&
      (typeof tagId !== 'string' ||
        !tagId ||
        recipe.tags.some((tag) => tag.id === tagId)) &&
      (typeof difficulty !== 'string' ||
        !difficulty ||
        recipe.difficulty === difficulty)
    )
  }

  const sortRecipes = (recipes: RecipeWeb[], key: unknown[]) => {
    const field = key[4]
    if (field === 'favorite') {
      const favoriteFirst = key[5] !== 'desc'
      return recipes.sort((left, right) => {
        const leftFavorite = hasFavorite(left.id)
        const rightFavorite = hasFavorite(right.id)
        if (leftFavorite === rightFavorite) return 0
        return leftFavorite === favoriteFirst ? -1 : 1
      })
    }
    if (
      field !== 'name' &&
      field !== 'createdAt' &&
      field !== 'updatedAt' &&
      field !== 'time'
    ) return recipes
    const direction = key[5] === 'desc' ? -1 : 1
    return recipes.sort((left, right) => {
      const a = left[field]
      const b = right[field]
      const result = typeof a === 'number' && typeof b === 'number'
        ? a - b
        : String(a).localeCompare(String(b))
      return result * direction || left.id.localeCompare(right.id)
    })
  }

  const addOptimisticRecipe = (
    data: InfiniteRecipeData,
    key: unknown[],
    recipe: RecipeWeb
  ): InfiniteRecipeData | undefined => {
    const first = data.pages[0]
    if (!first || first.items.some((item) => item.id === recipe.id) ||
      !matchesList(key, recipe)) return undefined

    const items = sortRecipes([...first.items, recipe], key)
      .slice(0, first.pageSize)
    const total = first.total + 1
    const pages = data.pages.slice()
    pages[0] = {
      ...first,
      items,
      total,
      nextPage: total > first.pageSize ? first.page + 1 : null
    }
    return { ...data, pages }
  }

  const patchOptimisticRecipe = (
    data: InfiniteRecipeData,
    key: unknown[],
    recipe: RecipeWeb
  ): InfiniteRecipeData | undefined => {
    let changed = false
    const pages = data.pages.map((page) => {
      const previous = page.items.find((item) => item.id === recipe.id)
      if (!previous) return page
      changed = true
      const matches = matchesList(key, recipe)
      const items = matches
        ? sortRecipes(page.items.map((item) =>
            item.id === recipe.id ? recipe : item
          ), key)
        : page.items.filter((item) => item.id !== recipe.id)
      return {
        ...page,
        items,
        total: matches ? page.total : Math.max(0, page.total - 1)
      }
    })
    return changed
      ? { ...data, pages }
      : addOptimisticRecipe(data, key, recipe)
  }

  const removeOptimisticRecipe = (
    data: InfiniteRecipeData,
    id: string
  ): InfiniteRecipeData | undefined => {
    let changed = false
    const pages = data.pages.map((page) => {
      if (!page.items.some((item) => item.id === id)) return page
      changed = true
      return {
        ...page,
        items: page.items.filter((item) => item.id !== id),
        total: Math.max(0, page.total - 1)
      }
    })
    return changed ? { ...data, pages } : undefined
  }

  const create = useMutation({
    mutation: ({ body }: CreateRecipeVariables) =>
      $fetch<RecipeWeb>('/api/recipes', { method: 'POST', body }),
    async onMutate({ optimisticRecipe }) {
      await queryCache.cancelQueries({ key: ['recipes'] })
      return {
        optimisticRecipe,
        snapshots: updateLists((data, key) =>
          addOptimisticRecipe(data, key, optimisticRecipe)
        )
      }
    },
    onSuccess(recipe, _variables, context) {
      if (context?.optimisticRecipe.id) {
        updateLists((data) => {
          let changed = false
          const pages = data.pages.map((page) => {
            if (!page.items.some((item) =>
              item.id === context.optimisticRecipe.id
            )) return page
            changed = true
            return {
              ...page,
              items: page.items.map((item) =>
                item.id === context.optimisticRecipe.id ? recipe : item
              )
            }
          })
          return changed ? { ...data, pages } : undefined
        })
      }
      queryCache.setQueryData(['recipe', recipe.id], recipe)
    },
    onError(_error, _variables, context) {
      rollbackLists(context?.snapshots)
    },
    async onSettled() {
      await queryCache.invalidateQueries({ key: ['recipes'] })
    }
  })

  const update = useMutation({
    mutation: ({ id, body }: UpdateRecipeVariables) =>
      $fetch(`/api/recipes/${id}`, { method: 'PUT', body }),
    async onMutate({ id, optimisticRecipe }) {
      await queryCache.cancelQueries({ key: ['recipes'] })
      await queryCache.cancelQueries({ key: ['recipe', id] })
      const oldRecipe = queryCache.getQueryData<RecipeWeb | null>(['recipe', id])
      queryCache.setQueryData(['recipe', id], optimisticRecipe)
      return {
        oldRecipe,
        optimisticRecipe,
        snapshots: updateLists((data, key) =>
          patchOptimisticRecipe(data, key, optimisticRecipe)
        )
      }
    },
    onError(_error, { id }, context) {
      rollbackLists(context?.snapshots)
      if (queryCache.getQueryData(['recipe', id]) === context?.optimisticRecipe) {
        if (context?.oldRecipe === undefined) {
          const entry = queryCache.get(['recipe', id])
          if (entry) queryCache.remove(entry)
        } else {
          queryCache.setQueryData(['recipe', id], context.oldRecipe)
        }
      }
    },
    async onSettled(_data, _error, { id }) {
      await Promise.all([
        queryCache.invalidateQueries({ key: ['recipes'] }),
        queryCache.invalidateQueries({ key: ['recipe', id] })
      ])
    }
  })

  const remove = useMutation({
    mutation: ({ id }: DeleteRecipeVariables) =>
      $fetch(`/api/recipes/${id}`, { method: 'DELETE' }),
    async onMutate({ id }) {
      await queryCache.cancelQueries({ key: ['recipes'] })
      await queryCache.cancelQueries({ key: ['recipe', id] })
      const oldRecipe = queryCache.getQueryData<RecipeWeb | null>(['recipe', id])
      queryCache.setQueryData(['recipe', id], null)
      return {
        oldRecipe,
        snapshots: updateLists((data) => removeOptimisticRecipe(data, id))
      }
    },
    onError(_error, { id }, context) {
      rollbackLists(context?.snapshots)
      if (queryCache.getQueryData(['recipe', id]) === null) {
        if (context?.oldRecipe === undefined) {
          const entry = queryCache.get(['recipe', id])
          if (entry) queryCache.remove(entry)
        } else {
          queryCache.setQueryData(['recipe', id], context.oldRecipe)
        }
      }
    },
    async onSettled(_data, _error, { id }) {
      await Promise.all([
        queryCache.invalidateQueries({ key: ['recipes'] }),
        queryCache.invalidateQueries({ key: ['recipe', id] })
      ])
    }
  })

  return { create, update, remove }
}
