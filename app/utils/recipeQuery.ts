import {
  defaultRecipePageSize,
  recipeDifficultyWeb,
  recipeSortFieldsWeb,
  type ListRecipesApiQuery,
  type RecipeDifficultyWeb,
  type RecipeSortFieldWeb,
  type RecipeSortOrderWeb
} from '../../types/recipe'

/** Application-level sort key. `favorite` is resolved on the client only. */
export type RecipeListSortBy = '' | RecipeSortFieldWeb | 'favorite'

export interface RecipeListQuery {
  name: string
  tag: string
  difficulty: '' | RecipeDifficultyWeb
  sortBy: RecipeListSortBy
  sortOrder: RecipeSortOrderWeb
}

export const defaultRecipeListQuery = (): RecipeListQuery => ({
  name: '',
  tag: '',
  difficulty: '',
  sortBy: '',
  sortOrder: 'asc'
})

type RawQuery = Record<string, unknown>

const first = (value: unknown): string | undefined => {
  const single = Array.isArray(value) ? value[0] : value
  return typeof single === 'string' ? single : undefined
}

/** Reads and validates a router query; invalid values fall back to defaults. */
export const parseRecipeListQuery = (raw: RawQuery = {}): RecipeListQuery => {
  const defaults = defaultRecipeListQuery()
  const difficulty = first(raw.difficulty)
  const sortBy = first(raw.sortBy)
  const sortOrder = first(raw.sortOrder)
  return {
    name: first(raw.name) ?? defaults.name,
    tag: first(raw.tag) ?? defaults.tag,
    difficulty: recipeDifficultyWeb.includes(difficulty as RecipeDifficultyWeb)
      ? (difficulty as RecipeDifficultyWeb)
      : defaults.difficulty,
    sortBy: sortBy === 'favorite' || recipeSortFieldsWeb.includes(sortBy as RecipeSortFieldWeb)
      ? (sortBy as RecipeListSortBy)
      : defaults.sortBy,
    sortOrder: sortOrder === 'desc' ? 'desc' : defaults.sortOrder
  }
}

/** Serializes to router query strings, omitting default values. */
export const serializeRecipeListQuery = (query: RecipeListQuery): Record<string, string> => {
  const out: Record<string, string> = {}
  if (query.name) out.name = query.name
  if (query.tag) out.tag = query.tag
  if (query.difficulty) out.difficulty = query.difficulty
  if (query.sortBy) out.sortBy = query.sortBy
  if (query.sortBy && query.sortOrder !== 'asc') out.sortOrder = query.sortOrder
  return out
}

/** Maps the application query + page number to the backend representation. */
export const mapRecipeListQueryToApi = (
  query: RecipeListQuery,
  page = 1,
  pageSize = defaultRecipePageSize
): ListRecipesApiQuery => ({
  ...(query.name ? { name: query.name } : {}),
  ...(query.tag ? { tag: query.tag } : {}),
  ...(query.difficulty ? { difficulty: query.difficulty } : {}),
  ...(query.sortBy && query.sortBy !== 'favorite'
    ? { sort: query.sortBy, order: query.sortOrder }
    : {}),
  page,
  pageSize
})
