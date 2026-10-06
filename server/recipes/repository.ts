import { useStorageRepositories } from '../storage/container'
import type { DocumentFilter } from '../storage/contracts'
import {
  defaultRecipePageSize,
  type ListRecipesApiQuery,
  type RecipeData
} from '../../types/recipe'

export const useRecipeRepository = () => useStorageRepositories().recipes

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const queryRecipePage = async (
  query: ListRecipesApiQuery,
  userId: string | undefined,
  favoriteIds: ReadonlySet<string>
) => {
  const filters: DocumentFilter<RecipeData>[] = [
    {
      $or: [
        { isPublic: { $ne: false } },
        ...(userId ? [{ ownerId: userId }] : [])
      ]
    }
  ]
  const name = query.name?.trim()
  if (name) filters.push({ name: { $regex: escapeRegex(name), $options: 'i' } })
  if (query.tag) filters.push({ tags: query.tag })
  if (query.difficulty) filters.push({ difficulty: query.difficulty })

  const pageSize = query.pageSize ?? defaultRecipePageSize
  const page = query.page ?? 1
  const sort = query.sort
  const sortBy = sort === 'favorite' ? undefined : sort ?? 'createdAt'
  const result = await useRecipeRepository().page({
    filter: { $and: filters },
    offset: (page - 1) * pageSize,
    limit: pageSize,
    sortBy,
    sortDirection: query.order === 'desc' ? 'desc' : 'asc',
    ...(sort === 'favorite' ? { favoriteIds: [...favoriteIds] } : {})
  })

  return {
    items: result.items,
    total: result.total,
    page,
    pageSize,
    nextPage: result.offset + pageSize < result.total ? page + 1 : null
  }
}
