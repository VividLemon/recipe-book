import { setInfiniteQueryData, useMutation, useQueryCache } from '@pinia/colada'
import type { RecipeWeb } from '../../types/recipe'
import { recipeKeys } from '~/queries/recipes'
import {
  appendRecipeToPages,
  recipeMatchesQuery,
  removeRecipeFromPages,
  updateRecipeInPages,
  type RecipePages
} from '~/queries/recipeCache'
import type { ListRecipesApiQuery } from '../../types/recipe'

interface Snapshot {
  lists: { key: readonly unknown[]; data: RecipePages | undefined }[]
  details: { key: readonly unknown[]; data: RecipeWeb | null | undefined }[]
}

export const useRecipeMutations = () => {
  const queryCache = useQueryCache()

  const snapshot = (): Snapshot => {
    queryCache.cancelQueries({ key: recipeKeys.root })
    return {
      lists: queryCache.getEntries({ key: recipeKeys.lists() }).map((el) => ({
        key: el.key,
        data: el.state.value.data as RecipePages | undefined
      })),
      details: queryCache.getEntries({ key: recipeKeys.details() }).map((el) => ({
        key: el.key,
        data: el.state.value.data as RecipeWeb | null | undefined
      }))
    }
  }

  const restore = (previous: Snapshot | undefined) => {
    if (!previous) return
    for (const { key, data } of previous.lists) {
      if (data) setInfiniteQueryData(queryCache, key as never, data)
    }
    for (const { key, data } of previous.details) {
      if (data !== undefined) queryCache.setQueryData(key as never, data)
    }
  }

  const mapLists = (fn: (data: RecipePages, query: ListRecipesApiQuery) => RecipePages) => {
    for (const entry of queryCache.getEntries({ key: recipeKeys.lists() })) {
      const data = entry.state.value.data as RecipePages | undefined
      if (data) {
        setInfiniteQueryData(queryCache, entry.key as never, fn(data, entry.key[2] as ListRecipesApiQuery))
      }
    }
  }

  const invalidate = () => queryCache.invalidateQueries({ key: recipeKeys.root })

  const create = useMutation({
    mutation: ({ body }: { body: FormData, optimistic: RecipeWeb }) =>
      $fetch<RecipeWeb>('/api/recipes', { method: 'POST', body }),
    onMutate: ({ optimistic }) => {
      const previous = snapshot()
      mapLists((data, query) =>
        recipeMatchesQuery(optimistic, query) ? appendRecipeToPages(data, optimistic) : data
      )
      queryCache.setQueryData(recipeKeys.detail(optimistic.id), optimistic)
      return { previous, optimisticId: optimistic.id }
    },
    onSuccess: (created) => {
      queryCache.setQueryData(recipeKeys.detail(created.id), created)
    },
    onError: (_error, _vars, { previous }) => restore(previous),
    onSettled: (_data, _error, _vars, { optimisticId }) => {
      const placeholder = optimisticId ? queryCache.get(recipeKeys.detail(optimisticId)) : undefined
      if (placeholder) queryCache.remove(placeholder)
      return invalidate()
    }
  })

  const update = useMutation({
    mutation: ({ id, body }: { id: string, body: FormData, optimistic: RecipeWeb }) =>
      $fetch(`/api/recipes/${id}`, { method: 'PUT', body }),
    onMutate: ({ id, optimistic }) => {
      const previous = snapshot()
      mapLists((data) => updateRecipeInPages(data, optimistic))
      queryCache.setQueryData(recipeKeys.detail(id), optimistic)
      return { previous }
    },
    onError: (_error, _vars, { previous }) => restore(previous),
    onSettled: () => invalidate()
  })

  const remove = useMutation({
    mutation: ({ id }: { id: string }) =>
      $fetch(`/api/recipes/${id}`, { method: 'DELETE' }),
    onMutate: ({ id }) => {
      const previous = snapshot()
      mapLists((data) => removeRecipeFromPages(data, id))
      queryCache.setQueryData(recipeKeys.detail(id), null)
      return { previous }
    },
    onError: (_error, _vars, { previous }) => restore(previous),
    onSettled: () => invalidate()
  })

  return { create, update, remove }
}
