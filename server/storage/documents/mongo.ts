import type { DocumentEngine, DocumentFilter, DocumentPage, DocumentQuery, StorageId } from '../contracts'
import type { Collection, Filter } from 'mongodb'

type StoredDocument<T> = T & { _id: string }

export class MongoDocumentEngine<T> implements DocumentEngine<T> {
  constructor(private readonly collection: Collection<StoredDocument<T>>) {}

  async get(id: StorageId) {
    const document = await this.collection.findOne({ _id: id } as Filter<StoredDocument<T>>)
    if (!document) return null
    const { _id: _ignored, ...value } = document
    return value as T
  }

  async findOne(filter: DocumentFilter<T>) {
    const document = await this.collection.findOne(filter as Filter<StoredDocument<T>>)
    if (!document) return null
    const { _id: _ignored, ...value } = document
    return value as T
  }

  async list(query?: DocumentQuery<T>) {
    return (await this.page(query)).items
  }

  async page(query: DocumentQuery<T> = {}): Promise<DocumentPage<T>> {
    const offset = Math.max(0, query.offset ?? 0)
    const filter = (query.filter ?? {}) as Filter<StoredDocument<T>>
    let items: T[]
    if (query.favoriteIds) {
      const direction = query.sortDirection === 'desc' ? -1 : 1
      const pipeline = [
        { $match: filter },
        {
          $addFields: {
            _favoriteRank: {
              $cond: [{ $in: ['$id', query.favoriteIds] }, 0, 1]
            }
          }
        },
        { $sort: { _favoriteRank: direction, _id: 1 } },
        { $skip: offset },
        ...(query.limit === undefined ? [] : [{ $limit: Math.max(0, query.limit) }])
      ]
      const documents = await this.collection.aggregate<StoredDocument<T>>(pipeline).toArray()
      items = documents.map((document) => {
        const { _id: _ignored, _favoriteRank: _rank, ...value } =
          document as StoredDocument<T> & { _favoriteRank: number }
        return value as T
      })
    } else {
      const cursor = this.collection.find(filter)
      if (query.sortBy) {
        cursor.sort({
          [String(query.sortBy)]: query.sortDirection === 'desc' ? -1 : 1,
          _id: 1
        })
      }
      if (offset) cursor.skip(offset)
      if (query.limit !== undefined) cursor.limit(Math.max(0, query.limit))
      items = (await cursor.toArray()).map(({ _id: _ignored, ...value }) => value as T)
    }
    const total = await this.collection.countDocuments(
      filter
    )
    return { items, total, offset, limit: query.limit }
  }

  async set(id: StorageId, value: T) {
    await this.collection.replaceOne({ _id: id } as Filter<StoredDocument<T>>, { ...value, _id: id }, { upsert: true })
  }

  async remove(id: StorageId) {
    await this.collection.deleteOne({ _id: id } as Filter<StoredDocument<T>>)
  }
}
