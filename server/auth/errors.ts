export const invalidCredentialsError = () =>
  createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
