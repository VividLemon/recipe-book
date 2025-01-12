// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErrorObject = Record<string, any>
const extractErrors = (obj: ErrorObject): Record<string, string[]> => {
  const result: Record<string, string[]> = {}
  const deepSearch = (currentObj: ErrorObject, path: string[] = []) => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processIssues = (issues: any[]) => {
    for (const issue of issues) {
      if (issue.path && Array.isArray(issue.path) && issue.message) {
        const key = issue.path.join('.')
        if (!result[key]) {
          result[key] = []
        }
        result[key].push(issue.message)
      }
    }
  }
  if (Array.isArray(obj.issues)) {
    processIssues(obj.issues)
  } else {
    deepSearch(obj)
  }
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
