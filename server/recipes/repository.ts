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
  const repository = useRecipeRepository()
  const filter = { $and: filters }
  const offset = (page - 1) * pageSize
  const result = await repository.page(sort === 'favorite'
    ? { filter }
    : {
        filter,
        offset,
        limit: pageSize,
        sortBy: sort ?? 'createdAt',
        sortDirection: query.order === 'desc' ? 'desc' : 'asc'
      })
  const items = sort === 'favorite'
    ? result.items
        .sort((a, b) => {
          const rank = Number(favoriteIds.has(b.id)) - Number(favoriteIds.has(a.id))
          const direction = query.order === 'desc' ? -1 : 1
          return rank * direction || a.id.localeCompare(b.id)
        })
        .slice(offset, offset + pageSize)
    : result.items

  return {
    items,
    total: result.total,
    page,
    pageSize,
    nextPage: result.offset + pageSize < result.total ? page + 1 : null
  }
}
