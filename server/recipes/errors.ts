export const recipeLoginRequiredError = () =>
  createError({ statusCode: 401, statusMessage: 'Login required' })

export const recipeNotFoundError = () =>
  createError({ statusCode: 404, statusMessage: 'Recipe not found' })
