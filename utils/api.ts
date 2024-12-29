export const objToFormData = (obj: Record<string, string | File | number>) => {
  const formData = new FormData()
  for (const key in obj) {
    const value = obj[key]
    if (value !== undefined) {
      const serialized = typeof value === 'number' ? value.toString() : value
      formData.append(key, serialized)
    }
  }
  return formData
}
