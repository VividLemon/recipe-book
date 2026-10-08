import { v7 } from 'uuid'
import { findUserByEmail, findUserByUsername, useUserRepository } from './repository'
import { accountAlreadyExistsError, incorrectCurrentPasswordError } from './errors'
import type { PublicUser, UserData } from './types'

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
    passwordHash: await hashPassword(password),
    favorites: []
  }
  await useUserRepository().replaceOne({ id: user.id }, user)
  return user
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
  await useUserRepository().replaceOne({ id: user.id }, {
    ...user,
    passwordHash: await hashPassword(newPassword)
  })
}
