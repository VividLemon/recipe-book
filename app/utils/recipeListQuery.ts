import {
  recipeDifficultyWeb,
  type RecipeListApiQuery,
  type RecipeListApplicationQuery,
  type RecipeListSortField
} from '../../types/recipe'

const sortFields: RecipeListSortField[] = [
  'name',
  'createdAt',
  'updatedAt',
  'time',
  'favorite'
]

const queryString = (value: unknown): string =>
  typeof value === 'string' ? value : ''

const queryNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(queryString(value))
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const parseRecipeListRouteQuery = (
  routeQuery: Record<string, unknown>
): RecipeListApplicationQuery => {
  const difficulty = queryString(routeQuery.difficulty)
  const sort = queryString(routeQuery.sort)
  const direction = queryString(routeQuery.order)
  return {
    filters: {
      name: queryString(routeQuery.name),
      tagId: queryString(routeQuery.tag),
      difficulty: recipeDifficultyWeb.some((item) => item === difficulty)
        ? difficulty as RecipeListApplicationQuery['filters']['difficulty']
        : ''
    },
    sort: {
      field: sortFields.includes(sort as RecipeListSortField)
        ? sort as RecipeListSortField
        : '',
      direction: direction === 'desc' ? 'desc' : 'asc'
    },
    pagination: {
      page: queryNumber(routeQuery.page, 1),
      pageSize: Math.min(queryNumber(routeQuery.pageSize, 20), 100)
    }
  }
}

export const recipeListQueryToRouteQuery = (
  query: RecipeListApplicationQuery
): Record<string, string | undefined> => ({
  name: query.filters.name || undefined,
  tag: query.filters.tagId || undefined,
  difficulty: query.filters.difficulty || undefined,
  sort: query.sort.field || undefined,
  order: query.sort.field && query.sort.direction !== 'asc'
    ? query.sort.direction
    : undefined,
  page: query.pagination.page > 1 ? String(query.pagination.page) : undefined,
  pageSize: query.pagination.pageSize !== 20
    ? String(query.pagination.pageSize)
    : undefined
})

export const recipeListQueryToApiQuery = (
  query: RecipeListApplicationQuery,
  page = query.pagination.page
): RecipeListApiQuery => ({
  name: query.filters.name.trim() || undefined,
  tag: query.filters.tagId || undefined,
  difficulty: query.filters.difficulty || undefined,
  sortBy: query.sort.field && query.sort.field !== 'favorite'
    ? query.sort.field
    : undefined,
  sortOrder: query.sort.direction,
  page,
  pageSize: query.pagination.pageSize
})
