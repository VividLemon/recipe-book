import { useStorageRepositories } from '../storage/container'

export const useUserRepository = () => useStorageRepositories().users
