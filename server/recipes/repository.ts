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
  const result = await repository.find({
        filter,
        offset,
        limit: pageSize,
        sort: sort === 'favorite'
          ? [{
              field: 'id',
              direction: query.order === 'desc' ? 'desc' : 'asc',
              priorityValues: [...favoriteIds]
            }]
          : [{
              field: sort ?? 'createdAt',
              direction: query.order === 'desc' ? 'desc' : 'asc'
            }]
      })

  return {
    items: result.items,
    total: result.total,
    page,
    pageSize,
    nextPage: result.offset + pageSize < result.total ? page + 1 : null
  }
}
