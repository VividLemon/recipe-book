export type MultiPartData = Exclude<
  Awaited<ReturnType<typeof readMultipartFormData>>,
  undefined
>[number]

export const formDataToObj = (
  formData: MultiPartData[]
): Record<string, MultiPartData> =>
  formData.reduce((acc, val) => {
    if (!val.name) return acc
    return { ...acc, [val.name]: val }
  }, {})
