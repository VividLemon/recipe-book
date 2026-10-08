import type { DocumentEngine, DocumentFilter, DocumentPage, DocumentQuery, DocumentUpdate, StorageId } from '../contracts'
import { matchesDocumentFilter, compareDocuments } from './query'

export class MemoryDocumentEngine<T extends { id: StorageId }> implements DocumentEngine<T> {
  private readonly documents = new Map<StorageId, T>()

  async insertOne(value: T) {
    if (this.documents.has(value.id)) throw new Error(`Document ${value.id} already exists`)
    this.documents.set(value.id, structuredClone(value))
  }

  async insertMany(values: T[]) {
    for (const value of values) await this.insertOne(value)
  }

  async find(query: DocumentQuery<T> = {}): Promise<DocumentPage<T>> {
    const values = this.documents.values()
      .filter((value) => matchesDocumentFilter(value, query.filter))
      .toArray()
      .sort((a, b) => compareDocuments(a, b, query))
    const offset = Math.max(0, query.offset ?? 0)
    const total = values.length
    return { items: values.slice(offset, query.limit === undefined ? undefined : offset + Math.max(0, query.limit)), total, offset, limit: query.limit }
  }

  async findOne(filter: DocumentFilter<T>) {
    return this.documents.values().find((value) => matchesDocumentFilter(value, filter)) ?? null
  }

  async updateOne(filter: DocumentFilter<T>, update: DocumentUpdate<T>) {
    const value = await this.findOne(filter)
    if (value) this.documents.set(value.id, { ...value, ...structuredClone(update), id: value.id })
  }

  async updateMany(filter: DocumentFilter<T>, update: DocumentUpdate<T>) {
    const values = this.documents.values().filter((value) => matchesDocumentFilter(value, filter)).toArray()
    for (const value of values) {
      this.documents.set(value.id, { ...value, ...structuredClone(update), id: value.id })
    }
  }

  async replaceOne(filter: DocumentFilter<T>, replacement: T) {
    const existing = await this.findOne(filter)
    if (existing) {
      if (existing.id !== replacement.id) throw new Error('Cannot change a document ID')
      this.documents.set(existing.id, structuredClone(replacement))
      return
    }
    await this.insertOne(replacement)
  }

  async deleteOne(filter: DocumentFilter<T>) {
    const value = await this.findOne(filter)
    if (value) this.documents.delete(value.id)
  }

  async deleteMany(filter: DocumentFilter<T>) {
    const values = this.documents.values().filter((value) => matchesDocumentFilter(value, filter)).toArray()
    for (const value of values) this.documents.delete(value.id)
  }
}
