// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErrorObject = Record<string, any>
function extractErrors(obj: ErrorObject): Record<string, string[]> {
  const result: Record<string, string[]> = {}

  function deepSearch(currentObj: ErrorObject, path: string[] = []) {
    if (currentObj && typeof currentObj === 'object') {
      for (const key in currentObj) {
        if (key === '_errors' && Array.isArray(currentObj[key])) {
          // Use the last key in the path if available, or "root" for top-level _errors
          const parentKey = path[path.length - 1] || 'root'
          result[parentKey] = currentObj[key]
        } else {
          deepSearch(currentObj[key], [...path, key])
        }
      }
    }
  }

  deepSearch(obj)
  return result
}

export const errorToString = (error: unknown) => {
  // Validation errors
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'data' in error.data &&
    typeof error.data.data === 'object' &&
    error.data.data !== null
  ) {
    const errors = Object.entries(extractErrors(error.data.data))
      .filter(([, value]) => value.length > 0)
      .map(([key, value]) => `${key.toUpperCase()}: ${value.join(', ')}`)
      .join('... ')
    return `Validation Error: ${errors}`
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'message' in error.data
  ) {
    return `Response: ${String(error.data.message)}`
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return `Response ${String(error.message)}`
  }
  return String(error)
}
