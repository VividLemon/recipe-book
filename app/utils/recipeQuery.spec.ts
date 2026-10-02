import { describe, expect, it } from 'vitest'
import {
  defaultRecipeListQuery,
  mapRecipeListQueryToApi,
  parseRecipeListQuery,
  serializeRecipeListQuery
} from './recipeQuery'

describe('recipe list query', () => {
  it('uses defaults for empty or invalid input', () => {
    expect(parseRecipeListQuery({})).toEqual(defaultRecipeListQuery())
    expect(
      parseRecipeListQuery({ difficulty: 'Nope', sortBy: 'bogus', sortOrder: 'sideways' })
    ).toEqual(defaultRecipeListQuery())
  })

  it('parses valid values and takes the first of repeated params', () => {
    expect(
      parseRecipeListQuery({
        name: ['soup', 'x'],
        tag: 't1',
        difficulty: 'Hard',
        sortBy: 'time',
        sortOrder: 'desc'
      })
    ).toEqual({ name: 'soup', tag: 't1', difficulty: 'Hard', sortBy: 'time', sortOrder: 'desc' })
  })

  it('round-trips through serialization and omits defaults', () => {
    expect(serializeRecipeListQuery(defaultRecipeListQuery())).toEqual({})
    const query = { name: 'a', tag: 't', difficulty: 'Easy' as const, sortBy: 'favorite' as const, sortOrder: 'desc' as const }
    expect(parseRecipeListQuery(serializeRecipeListQuery(query))).toEqual(query)
  })

  it('maps to the API representation', () => {
    expect(mapRecipeListQueryToApi(defaultRecipeListQuery(), 2, 5)).toEqual({ page: 2, pageSize: 5 })
    expect(
      mapRecipeListQueryToApi({ name: 'a', tag: 't', difficulty: 'Hard', sortBy: 'name', sortOrder: 'desc' })
    ).toEqual({ name: 'a', tag: 't', difficulty: 'Hard', sort: 'name', order: 'desc', page: 1, pageSize: 12 })
  })

  it('does not send the client-only favorite sort to the server', () => {
    const api = mapRecipeListQueryToApi({ ...defaultRecipeListQuery(), sortBy: 'favorite' })
    expect(api).not.toHaveProperty('sort')
  })
})
