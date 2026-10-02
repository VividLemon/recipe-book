import type {
  RecipeData,
  RecipeDifficultyData,
  RecipeListApiQuery
} from '../../types/recipe'

export interface RecipeListBackendQuery {
  filters: {
    name?: string
    tagId?: string
    difficulty?: RecipeDifficultyData
  }
  sorting: {
    field: 'name' | 'createdAt' | 'updatedAt' | 'time'
    direction: 'asc' | 'desc'
  }
  pagination: {
    page: number
    pageSize: number
  }
}

export const mapRecipeListApiQueryToBackend = (
  query: RecipeListApiQuery
): RecipeListBackendQuery => ({
  filters: {
    name: query.name,
    tagId: query.tag,
    difficulty: query.difficulty
  },
  sorting: {
    field: query.sortBy || 'createdAt',
    direction: query.sortBy ? query.sortOrder : 'desc'
  },
  pagination: {
    page: query.page,
    pageSize: query.pageSize
  }
})

export const applyRecipeListQuery = (
  recipes: RecipeData[],
  query: RecipeListBackendQuery
): { items: RecipeData[]; total: number; nextPage: number | null } => {
  const name = query.filters.name?.toLocaleLowerCase()
  const filtered = recipes.filter((recipe) =>
    (!name || recipe.name.toLocaleLowerCase().includes(name)) &&
    (!query.filters.tagId || recipe.tags.includes(query.filters.tagId)) &&
    (!query.filters.difficulty ||
      recipe.difficulty === query.filters.difficulty)
  )
  const { field, direction } = query.sorting
  filtered.sort((left, right) => {
    const leftValue = left[field]
    const rightValue = right[field]
    const result =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue))
    return (direction === 'asc' ? result : -result) ||
      left.id.localeCompare(right.id)
  })

  const start = (query.pagination.page - 1) * query.pagination.pageSize
  const items = filtered.slice(start, start + query.pagination.pageSize)
  return {
    items,
    total: filtered.length,
    nextPage: start + items.length < filtered.length
      ? query.pagination.page + 1
      : null
  }
}
