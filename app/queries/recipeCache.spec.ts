import { describe, expect, it } from 'vitest'
import {
  appendRecipeToPages,
  buildOptimisticRecipe,
  flattenRecipePages,
  recipeMatchesQuery,
  removeRecipeFromPages,
  updateRecipeInPages,
  type RecipePages
} from './recipeCache'
import type { RecipeWeb } from '../../types/recipe'

const recipe = (id: string, extra: Partial<RecipeWeb> = {}): RecipeWeb => ({
  id, createdAt: 1, updatedAt: 1, name: id, ingredients: [], tags: [], steps: '', difficulty: 'Easy', time: 1, ...extra
})
const pages = (): RecipePages => ({
  pageParams: [1, 2],
  pages: [
    { items: [recipe('a'), recipe('b')], total: 3, page: 1, pageSize: 2, nextPage: 2 },
    { items: [recipe('c')], total: 3, page: 2, pageSize: 2, nextPage: null }
  ]
})

describe('recipe cache helpers', () => {
  it('flattens pages in order', () => {
    expect(flattenRecipePages(pages()).map((el) => el.id)).toEqual(['a', 'b', 'c'])
    expect(flattenRecipePages(undefined)).toEqual([])
  })

  it('updates without mutating the snapshot', () => {
    const original = pages()
    const next = updateRecipeInPages(original, recipe('b', { name: 'new' }))
    expect(flattenRecipePages(next)[1]!.name).toBe('new')
    expect(flattenRecipePages(original)[1]!.name).toBe('b')
  })

  it('removes and decrements totals only where present', () => {
    const original = pages()
    const next = removeRecipeFromPages(original, 'c')
    expect(next.pages[1]!.items).toEqual([])
    expect(next.pages[1]!.total).toBe(2)
    expect(next.pages[0]).toBe(original.pages[0])
  })

  it('appends only when the last page is the final one', () => {
    const appended = appendRecipeToPages(pages(), recipe('d'))
    expect(flattenRecipePages(appended).map((el) => el.id)).toEqual(['a', 'b', 'c', 'd'])
    const partial = { ...pages(), pages: pages().pages.slice(0, 1) }
    expect(appendRecipeToPages(partial, recipe('d'))).toBe(partial)
  })

  it('matches recipes against list filters', () => {
    const r = recipe('Soup', { difficulty: 'Hard', tags: [{ id: 't', createdAt: 1, text: 't' }] })
    expect(recipeMatchesQuery(r, { name: 'sou', tag: 't', difficulty: 'Hard' })).toBe(true)
    expect(recipeMatchesQuery(r, { difficulty: 'Easy' })).toBe(false)
  })

  it('builds optimistic recipes resolving tags', () => {
    const built = buildOptimisticRecipe(
      { name: 'x', ingredients: [], steps: 's', difficulty: 'Easy', time: 3, tags: ['t', 'missing'] },
      [{ id: 't', createdAt: 1, text: 'T' }],
      { id: 'r1', createdAt: 5 }
    )
    expect(built).toMatchObject({ id: 'r1', createdAt: 5, tags: [{ id: 't' }] })
    expect(built.tags).toHaveLength(1)
  })
})
