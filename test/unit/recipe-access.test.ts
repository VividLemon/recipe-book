import { describe, expect, it } from 'vitest'
import { canAccessRecipe, canManageRecipe } from '../../server/recipes/access'
import { canAccessPhoto, isPhotoPublic } from '../../server/photos/access'
import type { RecipeData } from '../../types/recipe'

const privateRecipe: RecipeData = {
  id: 'private-recipe',
  ownerId: 'owner',
  isPublic: false,
  createdAt: 0,
  updatedAt: 0,
  name: 'Private',
  ingredients: [],
  tags: [],
  steps: '',
  difficulty: 'Easy',
  time: 1,
  photos: { stepsImages: ['/api/photos/secret.jpg'] }
}

describe('recipe access rules', () => {
  it('allows public reads but restricts private recipes to their owner', () => {
    expect(canAccessRecipe({ ...privateRecipe, isPublic: true }, undefined)).toBe(true)
    expect(canAccessRecipe(privateRecipe, undefined)).toBe(false)
    expect(canAccessRecipe(privateRecipe, 'owner')).toBe(true)
    expect(canManageRecipe(privateRecipe, 'owner')).toBe(true)
    expect(canManageRecipe(privateRecipe, 'other')).toBe(false)
  })

  it('protects photos referenced only by private recipes', () => {
    expect(canAccessPhoto([privateRecipe], '/api/photos/secret.jpg')).toBe(false)
    expect(canAccessPhoto([privateRecipe], '/api/photos/secret.jpg', 'owner')).toBe(true)
    expect(isPhotoPublic([privateRecipe], '/api/photos/secret.jpg')).toBe(false)
    expect(canAccessPhoto([privateRecipe], '/api/photos/unreferenced.jpg')).toBe(true)
  })

  it('makes a photo public when a public recipe references it too', () => {
    const publicRecipe = { ...privateRecipe, id: 'public-recipe', isPublic: true }
    expect(canAccessPhoto([privateRecipe, publicRecipe], '/api/photos/secret.jpg')).toBe(true)
    expect(isPhotoPublic([privateRecipe, publicRecipe], '/api/photos/secret.jpg')).toBe(true)
  })
})
