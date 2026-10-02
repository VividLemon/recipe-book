import { useInfiniteQuery } from '@pinia/colada'
import type {
  ReadRecipePageResponse,
  RecipeListApplicationQuery
} from '../../types/recipe'
import {
  parseRecipeListRouteQuery,
  recipeListQueryToApiQuery,
  recipeListQueryToRouteQuery
} from '../utils/recipeListQuery'

export const useRecipeList = () => {
  const route = useRoute()
  const router = useRouter()

  const query = computed(() =>
    parseRecipeListRouteQuery(route.query as Record<string, unknown>)
  )

  const updateQuery = (
    update: (current: RecipeListApplicationQuery) => RecipeListApplicationQuery
  ) => {
    const next = update(query.value)
    void router.replace({
      query: {
        ...route.query,
        ...recipeListQueryToRouteQuery(next)
      }
    })
  }

  const setFilter = (
    field: keyof RecipeListApplicationQuery['filters'],
    value: string
  ) => updateQuery((current) => ({
    ...current,
    filters: { ...current.filters, [field]: value },
    pagination: { ...current.pagination, page: 1 }
  }))

  const name = computed({
    get: () => query.value.filters.name,
    set: (value: string) => setFilter('name', value)
  })
  const tagId = computed({
    get: () => query.value.filters.tagId,
    set: (value: string) => setFilter('tagId', value)
  })
  const difficulty = computed({
    get: () => query.value.filters.difficulty,
    set: (value: string) => setFilter('difficulty', value)
  })
  const sortField = computed({
    get: () => query.value.sort.field,
    set: (value: RecipeListApplicationQuery['sort']['field']) =>
      updateQuery((current) => ({
        ...current,
        sort: { ...current.sort, field: value },
        pagination: { ...current.pagination, page: 1 }
      }))
  })
  const sortDirection = computed({
    get: () => query.value.sort.direction,
    set: (value: RecipeListApplicationQuery['sort']['direction']) =>
      updateQuery((current) => ({
        ...current,
        sort: { ...current.sort, direction: value },
        pagination: { ...current.pagination, page: 1 }
      }))
  })

  const recipeQuery = useInfiniteQuery({
    key: () => [
      'recipes',
      query.value.filters.name,
      query.value.filters.tagId,
      query.value.filters.difficulty,
      query.value.sort.field,
      query.value.sort.direction,
      query.value.pagination.pageSize
    ],
    initialPageParam: 1,
    query: ({ pageParam }) =>
      $fetch<ReadRecipePageResponse>('/api/recipes', {
        query: recipeListQueryToApiQuery(query.value, pageParam)
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 60_000
  })

  const recipes = computed(() =>
    recipeQuery.data.value?.pages
      .slice(0, query.value.pagination.page)
      .flatMap((page) => page.items) ?? []
  )
  const total = computed(() => recipeQuery.data.value?.pages[0]?.total ?? 0)

  const loadMore = async () => {
    if (!recipeQuery.hasNextPage.value ||
      recipeQuery.asyncStatus.value === 'loading') return
    const loadedPages = recipeQuery.data.value?.pages.length ?? 0
    if (loadedPages > query.value.pagination.page) {
      updateQuery((current) => ({
        ...current,
        pagination: { ...current.pagination, page: current.pagination.page + 1 }
      }))
      return
    }
    await recipeQuery.loadNextPage()
    const loadedPagesAfterFetch = recipeQuery.data.value?.pages.length ?? 1
    if (loadedPagesAfterFetch > query.value.pagination.page) {
      updateQuery((current) => ({
        ...current,
        pagination: { ...current.pagination, page: current.pagination.page + 1 }
      }))
    }
  }

  watch(
    [() => route.query.page, () => recipeQuery.data.value?.pages.length],
    async ([routePage]) => {
      const targetPage = Number(routePage) || 1
      while (
        (recipeQuery.data.value?.pages.length ?? 0) < targetPage &&
        recipeQuery.hasNextPage.value
      ) {
        const previousCount = recipeQuery.data.value?.pages.length ?? 0
        await recipeQuery.loadNextPage()
        if ((recipeQuery.data.value?.pages.length ?? 0) <= previousCount) break
      }
      const loadedPages = recipeQuery.data.value?.pages.length ?? 0
      if (loadedPages > 0 && loadedPages < targetPage) {
        updateQuery((current) => ({
          ...current,
          pagination: { ...current.pagination, page: loadedPages }
        }))
      }
    },
    { immediate: true }
  )

  return {
    ...recipeQuery,
    query,
    name,
    tagId,
    difficulty,
    sortField,
    sortDirection,
    recipes,
    total,
    loadMore
  }
}
