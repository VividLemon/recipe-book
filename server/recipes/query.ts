import {
  defaultRecipePageSize,
  type ListRecipesApiQuery,
  type RecipeData
} from '../../types/recipe'

export interface RecipeListPage {
  items: RecipeData[]
  total: number
  page: number
  pageSize: number
  nextPage: number | null
}

/** Applies name/tag/difficulty filters, sorting and page-number pagination. */
export const queryRecipes = (
  recipes: RecipeData[],
  query: ListRecipesApiQuery = {}
): RecipeListPage => {
  const name = query.name?.trim().toLowerCase()
  let values = recipes.filter((el) =>
    (!name || el.name.toLowerCase().includes(name))
    && (!query.tag || el.tags.includes(query.tag))
    && (!query.difficulty || el.difficulty === query.difficulty)
  )

  const { sort } = query
  const direction = query.order === 'desc' ? -1 : 1
  values = [...values].sort((a, b) => {
    if (!sort) return a.createdAt - b.createdAt || a.id.localeCompare(b.id)
    const valueA = a[sort]
    const valueB = b[sort]
    const result = typeof valueA === 'number' && typeof valueB === 'number'
      ? valueA - valueB
      : String(valueA).localeCompare(String(valueB))
    return result * direction || a.id.localeCompare(b.id)
  })

  const pageSize = query.pageSize ?? defaultRecipePageSize
  const page = query.page ?? 1
  const start = (page - 1) * pageSize
  return {
    items: values.slice(start, start + pageSize),
    total: values.length,
    page,
    pageSize,
    nextPage: start + pageSize < values.length ? page + 1 : null
  }
}
