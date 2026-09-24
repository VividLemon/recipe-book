import type { DocumentEngine, DocumentPage, DocumentQuery, StorageId } from '../contracts'

/**
 * Mongo adapter without a hard dependency. Pass a native Mongo collection (or
 * a compatible collection in tests) when Mongo is enabled by the host app.
 */
export interface MongoCollectionLike<T> {
  findOne(filter: { _id: string }): Promise<(T & { _id?: string }) | null>
  find(filter?: Partial<T>): { sort(spec: Record<string, 1 | -1>): MongoCursorLike<T>; skip(value: number): MongoCursorLike<T>; limit(value: number): MongoCursorLike<T>; toArray(): Promise<Array<T & { _id?: string }>> }
  replaceOne(filter: { _id: string }, value: T & { _id: string }, options: { upsert: true }): Promise<unknown>
  deleteOne(filter: { _id: string }): Promise<unknown>
  countDocuments?(filter?: Partial<T>): Promise<number>
}
export interface MongoCursorLike<T> {
  sort(spec: Record<string, 1 | -1>): MongoCursorLike<T>
  skip(value: number): MongoCursorLike<T>
  limit(value: number): MongoCursorLike<T>
  toArray(): Promise<Array<T & { _id?: string }>>
}

export class MongoDocumentEngine<T> implements DocumentEngine<T> {
  constructor(private readonly collection: MongoCollectionLike<T>) {}

  async get(id: StorageId) {
    const document = await this.collection.findOne({ _id: id })
    if (!document) return null
    const { _id: _ignored, ...value } = document
    return value as T
  }

  async list(query?: DocumentQuery<T>) {
    return (await this.page(query)).items
  }

  async page(query: DocumentQuery<T> = {}): Promise<DocumentPage<T>> {
    const offset = Math.max(0, query.offset ?? 0)
    const cursor = this.collection.find(query.filter)
    if (query.sortBy) cursor.sort({ [String(query.sortBy)]: query.sortDirection === 'desc' ? -1 : 1 })
    if (offset) cursor.skip(offset)
    if (query.limit !== undefined) cursor.limit(Math.max(0, query.limit))
    const items = (await cursor.toArray()).map(({ _id: _ignored, ...value }) => value as T)
    const total = this.collection.countDocuments
      ? await this.collection.countDocuments(query.filter)
      : items.length + offset
    return { items, total, offset, limit: query.limit }
  }

  async set(id: StorageId, value: T) {
    await this.collection.replaceOne({ _id: id }, { ...value, _id: id }, { upsert: true })
  }

  async remove(id: StorageId) {
    await this.collection.deleteOne({ _id: id })
  }
}
