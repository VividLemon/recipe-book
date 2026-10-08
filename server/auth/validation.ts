import { email, object, string } from 'zod'

export const login = object({
  email: email(),
  password: string().min(1).max(128)
})

export const register = object({
  username: string().trim().min(2).max(40),
  email: email(),
  password: string().min(8).max(128)
})
