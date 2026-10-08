export interface UserData {
  id: string
  username: string
  email: string
  passwordHash: string
  favorites: string[]
}

export type PublicUser = Pick<UserData, 'id' | 'username' | 'email'>
