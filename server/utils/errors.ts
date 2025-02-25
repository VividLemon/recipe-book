import type { ZodError } from 'zod'

export const photoError = (
  input?: Exclude<Parameters<typeof createError>[0], string>
) =>
  createError({
    status: 400,
    message: 'No photo attached',
    ...input
  })

export const validationError = (error: ZodError) =>
  createError({
    status: 400,
    statusMessage: 'Bad Request',
    data: error.format()
  })

export const noDataError = createError({
  status: 400,
  message: 'No data provided'
})

export const notFoundError = createError({
  status: 404,
  message: 'Item not found'
})

export const duplicationError = (label: string) =>
  createError({
    status: 400,
    message: `Item with ${label} already exists`
  })

export const noPhotoDirectoryError = createError({
  message: 'Server Error: Invalid directory',
  statusCode: 500
})

export const unknownPhotoError = photoError({
  statusCode: 500,
  message: 'Server Error: Could not process photo'
})
