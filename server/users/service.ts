import { v7 } from 'uuid'
import { findUserByEmail, findUserByUsername, useUserRepository } from './repository'
import { accountAlreadyExistsError, accountMissingError, incorrectCurrentPasswordError } from './errors'
import type { PublicUser, UserData } from './types'

// Serializes account writes so read-modify-write sequences cannot interleave.
let accountQueue: Promise<unknown> = Promise.resolve()
const withAccountLock = <T>(task: () => Promise<T>): Promise<T> => {
  const result = accountQueue.then(task, task)
  accountQueue = result.catch(() => undefined)
  return result
}

export { findUserByEmail, findUserByUsername } from './repository'

export const publicUser = ({ id, username, email }: UserData): PublicUser => ({
  id,
  username,
  email
})

export const registerUser = async ({
  username,
  email,
  password
}: {
  username: string
  email: string
  password: string
}) => {
  const passwordHash = await hashPassword(password)
  return withAccountLock(async () => {
    const [existingEmail, existingUsername] = await Promise.all([
      findUserByEmail(email),
      findUserByUsername(username)
    ])
    if (existingEmail || existingUsername) {
      throw accountAlreadyExistsError()
    }

    const user: UserData = {
      id: v7(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      favorites: []
    }
    await useUserRepository().insertOne(user)
    return user
  })
}

export const updateUser = async (user: UserData) =>
  useUserRepository().replaceOne({ id: user.id }, user)

export const updatePassword = async ({
  userId,
  oldPassword,
  newPassword
}: {
  userId: string
  oldPassword: string
  newPassword: string
}) => {
  const user = await useUserRepository().findOne({ id: userId })
  if (!user || !await verifyPassword(user.passwordHash, oldPassword)) {
    throw incorrectCurrentPasswordError()
  }
  const passwordHash = await hashPassword(newPassword)
  await withAccountLock(async () => {
    const current = await useUserRepository().findOne({ id: userId })
    if (!current || current.passwordHash !== user.passwordHash) throw incorrectCurrentPasswordError()
    await useUserRepository().updateOne({ id: userId }, { passwordHash })
  })
}

export const setUserFavorite = ({
  userId,
  recipeId,
  favorite
}: {
  userId: string
  recipeId: string
  favorite: boolean
}) => withAccountLock(async () => {
  const user = await useUserRepository().findOne({ id: userId })
  if (!user) throw accountMissingError()
  const favorites = new Set(user.favorites)
  if (favorite) favorites.add(recipeId)
  else favorites.delete(recipeId)
  const next = [...favorites]
  await useUserRepository().updateOne({ id: userId }, { favorites: next })
  return next
})
