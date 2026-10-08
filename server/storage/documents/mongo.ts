import type { DocumentEngine, DocumentFilter, DocumentPage, DocumentQuery, DocumentUpdate, StorageId } from '../contracts'
import type { Collection, Filter, Document as MongoDocument } from 'mongodb'

type StoredDocument<T> = T & { _id: string }

export class MongoDocumentEngine<T extends { id: StorageId }> implements DocumentEngine<T> {
  constructor(private readonly collection: Collection<StoredDocument<T>>) {}

  async insertOne(value: T) {
    await this.collection.insertOne({ ...value, _id: value.id } as never)
  }

  async insertMany(values: T[]) {
    if (values.length) {
      await this.collection.insertMany(values.map((value) => ({ ...value, _id: value.id })) as never)
    }
  }

  async find(query: DocumentQuery<T> = {}): Promise<DocumentPage<T>> {
    const offset = Math.max(0, query.offset ?? 0)
    const filter = (query.filter ?? {}) as Filter<StoredDocument<T>>
    const prioritySorts = query.sort?.filter((sort) => sort.priorityValues)
    const hasPrioritySort = Boolean(prioritySorts?.length)
    const pageQuery = query.limit === 0
      ? Promise.resolve([])
      : hasPrioritySort
      ? this.collection.aggregate<StoredDocument<T>>([
          { $match: filter as MongoDocument },
          ...prioritySorts!.map((sort, index) => {
            const field = String(sort.field)
            const indexKey = `__sort_${index}`
            return {
              $addFields: {
                [indexKey]: {
                  $let: {
                    vars: { rank: { $indexOfArray: [sort.priorityValues, `$${field}`] } },
                    in: {
                      $cond: [
                        { $lt: ['$$rank', 0] },
                        sort.priorityValues!.length,
                        '$$rank'
                      ]
                    }
                  }
                }
              }
            }
          }),
          {
            $sort: Object.fromEntries([
              ...query.sort!.map((sort, index) => [
                sort.priorityValues ? `__sort_${index}` : String(sort.field),
                sort.direction === 'desc' ? -1 : 1
              ]),
              ['_id', 1]
            ])
          },
          ...(offset ? [{ $skip: offset }] : []),
          ...(query.limit !== undefined ? [{ $limit: Math.max(0, query.limit) }] : []),
          ...(prioritySorts!.length ? [{ $unset: prioritySorts!.map((_, index) => `__sort_${index}`) }] : [])
        ]).toArray()
      : this.collection
          .find(filter)
          .sort(Object.fromEntries([
            ...(query.sort ?? []).map((sort) => [
              String(sort.field),
              sort.direction === 'desc' ? -1 : 1
            ]),
            ...(query.sort?.length ? [['_id', 1]] : [])
          ]))
          .skip(offset)
          .limit(query.limit === undefined ? 0 : query.limit)
          .toArray()
    const [documents, total] = await Promise.all([
      pageQuery,
      this.collection.countDocuments(filter)
    ])
    const items = documents.map(({ _id: _ignored, ...value }) => value as unknown as T)
    return { items, total, offset, limit: query.limit }
  }

  async findOne(filter: DocumentFilter<T>) {
    const document = await this.collection.findOne(filter as Filter<StoredDocument<T>>)
    if (!document) return null
    const { _id: _ignored, ...value } = document
    return value as unknown as T
  }

  async updateOne(filter: DocumentFilter<T>, update: DocumentUpdate<T>) {
    await this.collection.updateOne(filter as Filter<StoredDocument<T>>, { $set: update as never })
  }

  async updateMany(filter: DocumentFilter<T>, update: DocumentUpdate<T>) {
    await this.collection.updateMany(filter as Filter<StoredDocument<T>>, { $set: update as never })
  }

  async replaceOne(filter: DocumentFilter<T>, replacement: T) {
    await this.collection.replaceOne(
      filter as Filter<StoredDocument<T>>,
      { ...replacement, _id: replacement.id } as StoredDocument<T>,
      { upsert: true }
    )
  }

  async deleteOne(filter: DocumentFilter<T>) {
    await this.collection.deleteOne(filter as Filter<StoredDocument<T>>)
  }

  async deleteMany(filter: DocumentFilter<T>) {
    await this.collection.deleteMany(filter as Filter<StoredDocument<T>>)
  }
}
