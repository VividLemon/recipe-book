import { useStorageRepositories } from '../storage/container'

export const useUserRepository = () => useStorageRepositories().users

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const findUserByEmail = (email: string) =>
  useUserRepository().findOne({ email: email.trim().toLowerCase() })

export const findUserByUsername = (username: string) =>
  useUserRepository().findOne({
    username: { $regex: `^${escapeRegex(username.trim())}$`, $options: 'i' }
  })
