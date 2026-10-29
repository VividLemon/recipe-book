import {
  defaultRecipePageSize,
  type ListRecipesApiQuery,
  type RecipePageResponse,
  type RecipeWeb
} from '../../../types/recipe'
import { recipeMatchesQuery } from '../../queries/recipeCache'

/**
 * Filters, sorts and paginates recipes on the device the same way
 * `queryRecipePage` does on the server. Favorite ranking needs the server and
 * falls back to the default order.
 */
export const queryLocalRecipes = (
  recipes: RecipeWeb[],
  query: ListRecipesApiQuery = {}
): RecipePageResponse => {
  const field = !query.sort || query.sort === 'favorite' ? 'createdAt' : query.sort
  const direction = query.order === 'desc' ? -1 : 1
  const values = recipes
    .filter((recipe) => recipeMatchesQuery(recipe, query))
    .sort((a, b) => {
      const valueA = a[field]
      const valueB = b[field]
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
