const filePrefix = 'file_'

export const objToFormData = ({
  body,
  files
}: {
  files?: Record<string, File | null>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: Record<string, any>
}) => {
  const formData = new FormData()
  if (body) {
    formData.append('body', JSON.stringify(body))
  }
  if (files) {
    for (const key in files) {
      if (!files[key]) continue
      formData.append(`${filePrefix}${key}`, files[key])
    }
  }
  return formData
}

export const deserializeFormData = <
  T extends Record<string, unknown> = Record<string, unknown>
>(
  formData: MultiPartData[]
): T => {
  const bodyIndex = formData.findIndex((data) => data.name === 'body')
  const deserialized = JSON.parse(
    bodyIndex === -1 ? '{}' : (formData[bodyIndex].data as unknown as string)
  )

  const files = formData
    .filter((el) => el.name?.startsWith(filePrefix))
    .reduce(
      (acc, el) => {
        const key = el.name?.slice(filePrefix.length)
        if (key) {
          acc[key] = el.data
        }
        return acc
      },
      {} as Record<string, unknown>
    )

  return {
    ...deserialized,
    ...files
  }
}
