import { v7 } from 'uuid'
import { useUserRepository } from './repository'
import type { PublicUser, UserData } from './types'

export const publicUser = ({ id, username, email }: UserData): PublicUser => ({
  id,
  username,
  email
})

export const findUserByEmail = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase()
  return (await useUserRepository().list()).find((user) => user.email === normalizedEmail) ?? null
}

export const findUserByUsername = async (username: string) => {
  const normalizedUsername = username.trim().toLowerCase()
  return (await useUserRepository().list()).find((user) => user.username.toLowerCase() === normalizedUsername) ?? null
}

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
    throw createError({ statusCode: 409, statusMessage: 'Username or email is already registered' })
  }

  const user: UserData = {
    id: v7(),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: await hashPassword(password),
    favorites: []
  }
  await useUserRepository().set(user)
  return user
}

export const updateUser = async (user: UserData) => useUserRepository().set(user)

export const updatePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const user = await useUserRepository().get(userId)
  if (!user || !await verifyPassword(user.passwordHash, oldPassword)) {
    throw createError({ statusCode: 400, statusMessage: 'Current password is incorrect' })
  }
  await useUserRepository().set({
    ...user,
    passwordHash: await hashPassword(newPassword)
  })
}
