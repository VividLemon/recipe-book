import { describe, expect, it } from 'vitest'
import {
  parseRecipeListRouteQuery,
  recipeListQueryToApiQuery,
  recipeListQueryToRouteQuery
} from './recipeListQuery'

describe('recipe list query conversion', () => {
  it('parses valid route values and defaults invalid pagination', () => {
    expect(parseRecipeListRouteQuery({
      name: ' soup ',
      tag: 'tag-id',
      difficulty: 'Hard',
      sort: 'time',
      order: 'desc',
      page: '3',
      pageSize: '50'
    })).toEqual({
      filters: { name: 'soup', tagId: 'tag-id', difficulty: 'Hard' },
      sort: { field: 'time', direction: 'desc' },
      pagination: { page: 3, pageSize: 50 }
    })
    expect(parseRecipeListRouteQuery({
      difficulty: 'Impossible',
      sort: 'arbitrary',
      page: '0',
      pageSize: '500'
    })).toEqual({
      filters: { name: '', tagId: '', difficulty: '' },
      sort: { field: '', direction: 'asc' },
      pagination: { page: 1, pageSize: 100 }
    })
  })

  it('serializes default values minimally and converts favorites to API-safe sorting', () => {
    const query = parseRecipeListRouteQuery({
      sort: 'favorite',
      order: 'desc',
      page: '2'
    })
    expect(recipeListQueryToRouteQuery(query)).toEqual({
      name: undefined,
      tag: undefined,
      difficulty: undefined,
      sort: 'favorite',
      order: 'desc',
      page: '2',
      pageSize: undefined
    })
    expect(recipeListQueryToApiQuery(query, 4)).toEqual({
      name: undefined,
      tag: undefined,
      difficulty: undefined,
      sortBy: undefined,
      sortOrder: 'desc',
      page: 4,
      pageSize: 20
    })
  })
})
