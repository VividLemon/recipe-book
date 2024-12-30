export const objToFormData = (
  obj: Record<string, string | File | number | string[]>
) => {
  const formData = new FormData()
  for (const key in obj) {
    const value = obj[key]
    if (value !== undefined) {
      const serialized = Array.isArray(value)
        ? value.join(',')
        : typeof value === 'number'
          ? value.toString()
          : value
      formData.append(key, serialized)
    }
  }
  return formData
}
