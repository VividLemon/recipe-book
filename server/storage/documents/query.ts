import type { DocumentFilter, DocumentQuery } from '../contracts'

const matchesValue = (actual: unknown, expected: unknown) => {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    const operators = expected as { $ne?: unknown; $regex?: string; $options?: string }
    if ('$ne' in operators && actual === operators.$ne) return false
    if (typeof operators.$regex === 'string') {
      return typeof actual === 'string'
        && new RegExp(operators.$regex, operators.$options).test(actual)
    }
    return true
  }

  return Array.isArray(actual)
    ? actual.includes(expected)
    : actual === expected
}

export const matchesDocumentFilter = <T>(
  value: T,
  filter?: DocumentFilter<T>
): boolean => {
  if (!filter) return true

  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') {
      return (expected as DocumentFilter<T>[]).some((child) => matchesDocumentFilter(value, child))
    }
    if (key === '$and') {
      return (expected as DocumentFilter<T>[]).every((child) => matchesDocumentFilter(value, child))
    }
    return matchesValue((value as Record<string, unknown>)[key], expected)
  })
}

export const compareDocuments = <T>(
  a: T,
  b: T,
  query: Pick<DocumentQuery<T>, 'sortBy' | 'sortDirection'>
) => {
  const direction = query.sortDirection === 'desc' ? -1 : 1

  if (query.sortBy) {
    const key = query.sortBy
    const valueA = a[key]
    const valueB = b[key]
    const result = typeof valueA === 'number' && typeof valueB === 'number'
      ? valueA - valueB
      : String(valueA).localeCompare(String(valueB))
    const idA = String((a as { id?: string }).id ?? '')
    const idB = String((b as { id?: string }).id ?? '')
    return result * direction || idA.localeCompare(idB)
  }

  return 0
}
