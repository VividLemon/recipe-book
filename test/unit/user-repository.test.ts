import { beforeEach, describe, expect, it } from 'vitest'
import { configureStorage } from '../../server/storage/container'
import { findUserByEmail, findUserByUsername, useUserRepository } from '../../server/users/repository'
import type { UserData } from '../../server/users/types'

const user: UserData = {
  id: 'user-1',
  username: 'RecipeUser',
  email: 'recipe@example.test',
  passwordHash: 'password-hash',
  favorites: []
}

describe('user repository lookups', () => {
  beforeEach(async () => {
    const repositories = configureStorage({ documentBackend: 'memory', fileBackend: 'memory' })
    await repositories.users.replaceOne({ id: user.id }, user)
  })

  it('looks up normalized emails and case-insensitive usernames in the repository', async () => {
    await expect(findUserByEmail(' RECIPE@EXAMPLE.TEST ')).resolves.toEqual(user)
    await expect(findUserByUsername('recipeuser')).resolves.toEqual(user)
    await expect(findUserByUsername('missing')).resolves.toBeNull()
  })

  it('stores users through the configured repository', async () => {
    await expect(useUserRepository().findOne({ id: user.id })).resolves.toEqual(user)
  })
})
