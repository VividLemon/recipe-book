import { beforeEach, describe, expect, it } from 'vitest'
import { queryRecipePage } from '../../server/recipes/repository'
import { configureStorage } from '../../server/storage/container'
import type { RecipeData } from '../../types/recipe'

const makeRecipe = (
  id: string,
  createdAt: number,
  ownerId: string,
  isPublic: boolean
): RecipeData => ({
  id,
  ownerId,
  isPublic,
  createdAt,
  updatedAt: createdAt,
  name: `Recipe ${id}`,
  ingredients: [],
  tags: [],
  steps: '',
  difficulty: 'Easy',
  time: 10
})

describe('recipe repository queries', () => {
  beforeEach(async () => {
    const repositories = configureStorage({ documentBackend: 'memory', fileBackend: 'memory' })
    await Promise.all([
      repositories.recipes.set(makeRecipe('hidden-1', 1, 'other', false)),
      repositories.recipes.set(makeRecipe('hidden-2', 2, 'other', false)),
      repositories.recipes.set(makeRecipe('owned', 3, 'owner', false)),
      repositories.recipes.set(makeRecipe('public', 4, 'other', true))
    ])
  })

  it('applies visibility before filtering and pagination', async () => {
    const page = await queryRecipePage({ page: 1, pageSize: 1 }, 'owner', new Set())

    expect(page.items.map((recipe) => recipe.id)).toEqual(['owned'])
    expect(page.total).toBe(2)
    expect(page.nextPage).toBe(2)
  })

  it('ranks favorites before paginating while keeping the full result count', async () => {
    const firstPage = await queryRecipePage(
      { sort: 'favorite', page: 1, pageSize: 1 },
      'owner',
      new Set(['public'])
    )
    const secondPage = await queryRecipePage(
      { sort: 'favorite', page: 2, pageSize: 1 },
      'owner',
      new Set(['public'])
    )

    expect(firstPage.items.map((recipe) => recipe.id)).toEqual(['public'])
    expect(secondPage.items.map((recipe) => recipe.id)).toEqual(['owned'])
    expect(firstPage.total).toBe(2)
    expect(firstPage.nextPage).toBe(2)
  })
})
