import { describe, expect, it } from 'vitest'
import { queryRecipes } from '../../server/recipes/query'
import type { RecipeData } from '../../types/recipe'

const make = (i: number, extra: Partial<RecipeData> = {}): RecipeData => ({
  id: `id-${String(i).padStart(2, '0')}`,
  createdAt: i,
  updatedAt: 100 - i,
  name: `Recipe ${i}`,
  ingredients: [],
  tags: [],
  steps: '',
  difficulty: 'Easy',
  time: i,
  ...extra
})

const recipes = [
  make(1, { name: 'Apple Pie', tags: ['t1'], difficulty: 'Hard' }),
  make(2, { name: 'banana bread', tags: ['t1', 't2'] }),
  make(3, { name: 'Cherry tart', tags: ['t2'], difficulty: 'Hard' }),
  make(4, { name: 'Apple crumble' }),
  make(5, { name: 'Date cake' })
]

describe('queryRecipes', () => {
  it('returns all recipes with default pagination metadata', () => {
    const page = queryRecipes(recipes)
    expect(page.items).toHaveLength(5)
    expect(page).toMatchObject({ total: 5, page: 1, pageSize: 12, nextPage: null })
  })

  it('filters by name (case-insensitive), tag and difficulty', () => {
    expect(queryRecipes(recipes, { name: 'APPLE' }).items.map((el) => el.id)).toEqual(['id-01', 'id-04'])
    expect(queryRecipes(recipes, { tag: 't2' }).total).toBe(2)
    expect(queryRecipes(recipes, { difficulty: 'Hard' }).total).toBe(2)
    expect(queryRecipes(recipes, { name: 'apple', difficulty: 'Hard' }).items.map((el) => el.id)).toEqual(['id-01'])
  })

  it('sorts by string and number fields in both directions', () => {
    expect(queryRecipes(recipes, { sort: 'name', order: 'asc' }).items[0]!.name).toBe('Apple crumble')
    expect(queryRecipes(recipes, { sort: 'time', order: 'desc' }).items.map((el) => el.time)).toEqual([5, 4, 3, 2, 1])
    expect(queryRecipes(recipes, { sort: 'updatedAt' }).items[0]!.id).toBe('id-05')
  })

  it('paginates and reports whether more results exist', () => {
    const first = queryRecipes(recipes, { pageSize: 2 })
    expect(first.items.map((el) => el.id)).toEqual(['id-01', 'id-02'])
    expect(first.nextPage).toBe(2)
    const last = queryRecipes(recipes, { pageSize: 2, page: 3 })
    expect(last.items.map((el) => el.id)).toEqual(['id-05'])
    expect(last.nextPage).toBeNull()
    expect(queryRecipes(recipes, { pageSize: 2, page: 9 }).items).toEqual([])
  })

  it('paginates after filtering', () => {
    const page = queryRecipes(recipes, { name: 'apple', pageSize: 1 })
    expect(page).toMatchObject({ total: 2, nextPage: 2 })
  })

  it('sorts favorites across the full result set before pagination', () => {
    const page = queryRecipes(recipes, {
      sort: 'favorite',
      order: 'asc',
      pageSize: 2
    }, new Set(['id-04', 'id-05']))
    expect(page.items.map((recipe) => recipe.id)).toEqual(['id-04', 'id-05'])
    expect(page.total).toBe(5)
    expect(page.nextPage).toBe(2)
  })
})
