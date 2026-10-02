import type { DocumentEngine, DocumentPage, DocumentQuery, DocumentValue, StorageId } from '../contracts'
import type { Collection, Filter } from 'mongodb'

type StoredDocument<T extends object> = Omit<T, '_id'> & { _id: string }

export class MongoDocumentEngine<T extends DocumentValue> implements DocumentEngine<T> {
  constructor(private readonly collection: Collection<StoredDocument<T>>) {}

  async get(id: StorageId) {
    const document = await this.collection.findOne({ _id: id } as Filter<StoredDocument<T>>)
    if (!document) return null
    const { _id: _ignored, ...value } = document
    return value as T
  }

  async list(query?: DocumentQuery<T>) {
    return (await this.page(query)).items
  }

  async page(query: DocumentQuery<T> = {}): Promise<DocumentPage<T>> {
    const offset = Math.max(0, query.offset ?? 0)
    const cursor = this.collection.find(query.filter as Filter<StoredDocument<T>>)
    if (query.sortBy) cursor.sort({ [String(query.sortBy)]: query.sortDirection === 'desc' ? -1 : 1 })
    if (offset) cursor.skip(offset)
    if (query.limit !== undefined) cursor.limit(Math.max(0, query.limit))
    const items = (await cursor.toArray()).map(({ _id: _ignored, ...value }) => value as T)
    const total = await this.collection.countDocuments(
      query.filter as Filter<StoredDocument<T>>
    )
    return { items, total, offset, limit: query.limit }
  }

  async set(id: StorageId, value: T) {
    await this.collection.replaceOne(
      { _id: id } as Filter<StoredDocument<T>>,
      { ...value, _id: id },
      { upsert: true }
    )
  }

  async remove(id: StorageId) {
    await this.collection.deleteOne({ _id: id } as Filter<StoredDocument<T>>)
  }
}
