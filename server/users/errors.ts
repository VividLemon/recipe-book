export const accountAlreadyExistsError = () =>
  createError({ statusCode: 409, statusMessage: 'Username or email is already registered' })

export const accountMissingError = () =>
  createError({ statusCode: 401, statusMessage: 'Account no longer exists' })

export const incorrectCurrentPasswordError = () =>
  createError({ statusCode: 400, statusMessage: 'Current password is incorrect' })
