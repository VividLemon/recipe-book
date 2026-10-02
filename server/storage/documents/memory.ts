import type { DocumentEngine, DocumentPage, DocumentQuery, StorageId } from '../contracts'

export class MemoryDocumentEngine<T> implements DocumentEngine<T> {
  private readonly documents = new Map<StorageId, T>()

  async get(id: StorageId) {
    return this.documents.get(id) ?? null
  }

  async list(query?: DocumentQuery<T>) {
    return (await this.page(query)).items
  }

  async page(query: DocumentQuery<T> = {}): Promise<DocumentPage<T>> {
    let values = [...this.documents.values()].filter((value) =>
      !query.filter || Object.entries(query.filter).every(([key, expected]) => value[key as keyof T] === expected)
    )
    if (query.sortBy) {
      const key = query.sortBy
      values.sort((a, b) => String(a[key]).localeCompare(String(b[key])) * (query.sortDirection === 'desc' ? -1 : 1))
    }
    const offset = Math.max(0, query.offset ?? 0)
    const total = values.length
    return { items: values.slice(offset, query.limit === undefined ? undefined : offset + Math.max(0, query.limit)), total, offset, limit: query.limit }
  }

  async set(id: StorageId, value: T) {
    this.documents.set(id, structuredClone(value))
  }

  async remove(id: StorageId) {
    this.documents.delete(id)
  }
}
