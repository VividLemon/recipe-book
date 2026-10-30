import { describe, expect, it } from 'vitest'
import { queryLocalRecipes } from './query'
import type { RecipeWeb } from '../../../types/recipe'

const recipe = (id: string, extra: Partial<RecipeWeb> = {}): RecipeWeb => ({
  id, createdAt: 1, updatedAt: 1, name: id, ingredients: [], tags: [], steps: '', difficulty: 'Easy', time: 1, ...extra
})

const recipes = [
  recipe('c', { name: 'Carrot soup', createdAt: 3, time: 10, difficulty: 'Hard' }),
  recipe('a', { name: 'apple pie', createdAt: 1, time: 30, tags: [{ id: 't1', createdAt: 1, text: 'Dessert' }] }),
  recipe('b', { name: 'Bread', createdAt: 2, time: 30 })
]
const ids = (query: Parameters<typeof queryLocalRecipes>[1]) =>
  queryLocalRecipes(recipes, query).items.map((el) => el.id)

describe('queryLocalRecipes', () => {
  it('defaults to oldest first, honoring the order', () => {
    expect(ids({})).toEqual(['a', 'b', 'c'])
    expect(ids({ order: 'desc' })).toEqual(['c', 'b', 'a'])
  })

  it('sorts by field and breaks ties by id', () => {
    expect(ids({ sort: 'time' })).toEqual(['c', 'a', 'b'])
    expect(ids({ sort: 'time', order: 'desc' })).toEqual(['a', 'b', 'c'])
    expect(ids({ sort: 'name' })).toEqual(['a', 'b', 'c'])
  })

  it('falls back to the default order for favorite ranking', () => {
    expect(ids({ sort: 'favorite' })).toEqual(['a', 'b', 'c'])
  })

  it('filters by name, tag and difficulty', () => {
    expect(ids({ name: 'SOUP' })).toEqual(['c'])
    expect(ids({ tag: 't1' })).toEqual(['a'])
    expect(ids({ difficulty: 'Hard' })).toEqual(['c'])
  })

  it('paginates like the server', () => {
    expect(queryLocalRecipes(recipes, { page: 1, pageSize: 2 })).toMatchObject({
      total: 3, page: 1, pageSize: 2, nextPage: 2
    })
    const last = queryLocalRecipes(recipes, { page: 2, pageSize: 2 })
    expect(last.items.map((el) => el.id)).toEqual(['c'])
    expect(last.nextPage).toBeNull()
  })
})
