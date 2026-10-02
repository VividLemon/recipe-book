import type { RecipeDifficultyWeb } from './recipe'

/** Application-level representation of list filtering, sorting and pagination. */
export interface ListQuery<TFilter = Record<string, unknown>, TSort extends string = string> {
  offset?: number
  limit?: number
  filter?: TFilter
  sortBy?: TSort
  sortDirection?: 'asc' | 'desc'
}

export interface ListPage<T> {
  items: T[]
  total: number
  offset: number
  limit?: number
}

export const recipeSortKeys = ['name', 'createdAt', 'updatedAt', 'time'] as const
export type RecipeSortKey = (typeof recipeSortKeys)[number]
export interface RecipeFilter {
  difficulty?: RecipeDifficultyWeb
}
export type RecipeListQuery = ListQuery<RecipeFilter, RecipeSortKey>
