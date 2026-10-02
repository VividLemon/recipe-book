import { describe, expect, it } from 'vitest'
import { useRecipeListRoute } from './useRecipeListRoute'

describe('useRecipeListRoute', () => {
  it('reads the query from the URL and writes changes back, preserving unrelated params', async () => {
    const router = useRouter()
    await router.push({ path: '/', query: { name: 'soup', sortBy: 'time', openRecipe: 'x' } })
    const { query, apiQuery, update } = useRecipeListRoute()
    expect(query.value).toMatchObject({ name: 'soup', sortBy: 'time', sortOrder: 'asc' })
    expect(apiQuery.value).toMatchObject({ name: 'soup', sort: 'time', order: 'asc', page: 1 })

    await update({ difficulty: 'Hard', sortOrder: 'desc' })
    expect(router.currentRoute.value.query).toEqual({
      name: 'soup', difficulty: 'Hard', sortBy: 'time', sortOrder: 'desc', openRecipe: 'x'
    })
    expect(query.value.difficulty).toBe('Hard')

    await update({ name: '', sortBy: '' }, { replace: true })
    expect(router.currentRoute.value.query).toEqual({ difficulty: 'Hard', openRecipe: 'x' })
  })

  it('falls back to defaults for invalid URL values', async () => {
    await useRouter().push({ path: '/', query: { difficulty: 'Bogus' } })
    expect(useRecipeListRoute().query.value.difficulty).toBe('')
  })
})
