import type { DocumentFilter, DocumentQuery } from '../contracts'

const matchesValue = (actual: unknown, expected: unknown) => {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    const operators = expected as { $ne?: unknown; $exists?: boolean; $regex?: string; $options?: string }
    if (typeof operators.$exists === 'boolean' && (actual !== undefined) !== operators.$exists) return false
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
    const actual = key.split('.').reduce<unknown>(
      (current, part) => (current as Record<string, unknown> | null | undefined)?.[part],
      value
    )
    return matchesValue(actual, expected)
  })
}

export const compareDocuments = <T>(a: T, b: T, query: Pick<DocumentQuery<T>, 'sort'>) => {
  for (const sort of query.sort ?? []) {
    const valueA = a[sort.field]
    const valueB = b[sort.field]
    let result: number
    if (sort.priorityValues) {
      const rankA = sort.priorityValues.indexOf(valueA)
      const rankB = sort.priorityValues.indexOf(valueB)
      const normalizedRankA = rankA === -1 ? sort.priorityValues.length : rankA
      const normalizedRankB = rankB === -1 ? sort.priorityValues.length : rankB
      result = normalizedRankA - normalizedRankB
    } else {
      result = typeof valueA === 'number' && typeof valueB === 'number'
        ? valueA - valueB
        : String(valueA).localeCompare(String(valueB))
    }
    if (result) return result * (sort.direction === 'desc' ? -1 : 1)
  }

  if (query.sort?.length) {
    const idA = String((a as { id?: string }).id ?? '')
    const idB = String((b as { id?: string }).id ?? '')
    return idA.localeCompare(idB)
  }
  return 0
}
