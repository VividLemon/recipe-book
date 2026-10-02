import { describe, expect, it } from 'vitest'
import type { RecipeData } from '../../types/recipe'
import {
  applyRecipeListQuery,
  mapRecipeListApiQueryToBackend
} from '../../server/utils/recipe-list'
import { recipes } from '../../server/utils/validation'

const recipe = (values: Partial<RecipeData> & Pick<RecipeData, 'id' | 'name'>): RecipeData => ({
  id: values.id,
  name: values.name,
  createdAt: values.createdAt ?? 1,
  updatedAt: values.updatedAt ?? 1,
  ingredients: [],
  tags: values.tags ?? [],
  steps: '',
  difficulty: values.difficulty ?? 'Easy',
  time: values.time ?? 10
})

describe('recipe list backend mapping', () => {
  it('validates API query strings and supplies pagination defaults', () => {
    expect(recipes.read.query.parse({
      name: ' soup ',
      page: '3',
      pageSize: '25',
      sortOrder: 'desc'
    })).toEqual({
      name: 'soup',
      page: 3,
      pageSize: 25,
      sortOrder: 'desc'
    })
    expect(recipes.read.query.safeParse({
      page: '0',
      pageSize: '101'
    }).success).toBe(false)
  })

  it('maps the HTTP query into application filters, ordering, and pagination', () => {
    expect(mapRecipeListApiQueryToBackend({
      name: 'soup',
      tag: 'tag-id',
      difficulty: 'Hard',
      sortBy: 'time',
      sortOrder: 'asc',
      page: 2,
      pageSize: 5
    })).toEqual({
      filters: { name: 'soup', tagId: 'tag-id', difficulty: 'Hard' },
      sorting: { field: 'time', direction: 'asc' },
      pagination: { page: 2, pageSize: 5 }
    })
  })

  it('filters before sorting and paginating, returning the next page metadata', () => {
    const result = applyRecipeListQuery([
      recipe({ id: '1', name: 'Tomato Soup', tags: ['tag'], time: 30 }),
      recipe({ id: '2', name: 'Tomato Salad', tags: ['tag'], time: 15 }),
      recipe({ id: '3', name: 'Chicken Soup', tags: ['tag'], time: 10 }),
      recipe({ id: '4', name: 'Tomato Stew', tags: ['other'], time: 5 })
    ], {
      filters: { name: 'tomato', tagId: 'tag', difficulty: undefined },
      sorting: { field: 'time', direction: 'asc' },
      pagination: { page: 1, pageSize: 1 }
    })

    expect(result).toEqual({
      items: [expect.objectContaining({ id: '2' })],
      total: 2,
      nextPage: 2
    })
    expect(applyRecipeListQuery([
      recipe({ id: '1', name: 'Tomato Soup', tags: ['tag'] }),
      recipe({ id: '2', name: 'Tomato Salad', tags: ['tag'] })
    ], {
      filters: { name: 'tomato', tagId: 'tag', difficulty: undefined },
      sorting: { field: 'createdAt', direction: 'desc' },
      pagination: { page: 2, pageSize: 1 }
    }).nextPage).toBeNull()
  })
})
