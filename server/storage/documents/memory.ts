import type { DocumentEngine, DocumentFilter, DocumentPage, DocumentQuery, StorageId } from '../contracts'
import { compareDocuments, matchesDocumentFilter } from './query'

export class MemoryDocumentEngine<T> implements DocumentEngine<T> {
  private readonly documents = new Map<StorageId, T>()

  async get(id: StorageId) {
    return this.documents.get(id) ?? null
  }

  async findOne(filter: DocumentFilter<T>) {
    return [...this.documents.values()].find((value) => matchesDocumentFilter(value, filter)) ?? null
  }

  async list(query?: DocumentQuery<T>) {
    return (await this.page(query)).items
  }

  async page(query: DocumentQuery<T> = {}): Promise<DocumentPage<T>> {
    const values = [...this.documents.values()]
      .filter((value) => matchesDocumentFilter(value, query.filter))
      .sort((a, b) => compareDocuments(a, b, query))
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
