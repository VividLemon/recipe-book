export const objToFormData = (
  obj: Record<
    string,
    string | File | number | unknown[] | Record<string, unknown> | null
  >
) => {
  const formData = new FormData()
  for (const key in obj) {
    const value = obj[key]
    if (value === null) continue
    if (value !== undefined) {
      const serialized = Array.isArray(value)
        ? JSON.stringify(value)
        : typeof value === 'object' &&
            !(value instanceof File) &&
            value !== null
          ? JSON.stringify(value)
          : typeof value === 'number'
            ? value.toString()
            : value
      formData.append(key, serialized)
    }
  }
  return formData
}
