export type MultiPartData = Exclude<
  Awaited<ReturnType<typeof readMultipartFormData>>,
  undefined
>[number]

export type H3Event = Parameters<typeof useRuntimeConfig>[0]
