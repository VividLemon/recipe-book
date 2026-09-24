import type { DocumentEngine, StorageId } from '../contracts'

/**
 * Mongo adapter without a hard dependency. Pass a native Mongo collection (or
 * a compatible collection in tests) when Mongo is enabled by the host app.
 */
export interface MongoCollectionLike<T> {
  findOne(filter: { _id: string }): Promise<(T & { _id?: string }) | null>
  find(): { toArray(): Promise<Array<T & { _id?: string }>> }
  replaceOne(filter: { _id: string }, value: T & { _id: string }, options: { upsert: true }): Promise<unknown>
  deleteOne(filter: { _id: string }): Promise<unknown>
}

export class MongoDocumentEngine<T> implements DocumentEngine<T> {
  constructor(private readonly collection: MongoCollectionLike<T>) {}

  async get(id: StorageId) {
    const document = await this.collection.findOne({ _id: id })
    if (!document) return null
    const { _id: _ignored, ...value } = document
    return value as T
  }

  async list() {
    return (await this.collection.find().toArray()).map(({ _id: _ignored, ...value }) => value as T)
  }

  async set(id: StorageId, value: T) {
    await this.collection.replaceOne({ _id: id }, { ...value, _id: id }, { upsert: true })
  }

  async remove(id: StorageId) {
    await this.collection.deleteOne({ _id: id })
  }
}
