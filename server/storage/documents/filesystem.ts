import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { DocumentEngine, DocumentFilter, DocumentPage, DocumentQuery, StorageId } from '../contracts'
import { assertStorageKey, normalizeStorageError } from '../contracts'
import { compareDocuments, matchesDocumentFilter } from './query'

export class FilesystemDocumentEngine<T extends { id: StorageId }> implements DocumentEngine<T> {
  constructor(private readonly directory: string) {}

  private path(id: StorageId) {
    return join(this.directory, `${assertStorageKey(id)}.json`)
  }

  private async read(id: StorageId): Promise<T | null> {
    try {
      return JSON.parse(await readFile(this.path(id), 'utf8')) as T
    } catch (error: any) {
      if (error?.code === 'ENOENT') return null
      throw normalizeStorageError(error, 'read-failed', `Could not read document ${id}`)
    }
  }

  private async write(value: T) {
    let temporary: string | undefined
    try {
      await mkdir(this.directory, { recursive: true })
      const destination = this.path(value.id)
      temporary = `${destination}.${process.pid}.${Date.now()}.tmp`
      await writeFile(temporary, JSON.stringify(value), { encoding: 'utf8', flag: 'wx' })
      await rename(temporary, destination)
      temporary = undefined
    } catch (error) {
      if (temporary) await rm(temporary, { force: true }).catch(() => undefined)
      throw normalizeStorageError(error, 'write-failed', `Could not write document ${value.id}`)
    }
  }

  async insertOne(value: T) {
    if (await this.read(value.id)) throw new Error(`Document ${value.id} already exists`)
    await this.write(value)
  }

  async insertMany(values: T[]) {
    for (const value of values) await this.insertOne(value)
  }

  async findOne(filter: DocumentFilter<T>) {
    return (await this.find({ filter, limit: 1 })).items[0] ?? null
  }

  async find(query: DocumentQuery<T> = {}): Promise<DocumentPage<T>> {
    try {
      const entries = await readdir(this.directory, { withFileTypes: true })
      const loadedValues = await Promise.all(entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => this.read(entry.name.slice(0, -5))))
      const values = (loadedValues.filter((value) => value !== null) as T[])
        .filter((value) => matchesDocumentFilter(value, query.filter))
        .sort((a, b) => compareDocuments(a, b, query))
      const offset = Math.max(0, query.offset ?? 0)
      return { items: values.slice(offset, query.limit === undefined ? undefined : offset + Math.max(0, query.limit)), total: values.length, offset, limit: query.limit }
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return { items: [], total: 0, offset: Math.max(0, query.offset ?? 0), limit: query.limit }
      }
      throw normalizeStorageError(error, 'read-failed', 'Could not find documents')
    }
  }

  async updateOne(filter: DocumentFilter<T>, update: Partial<T>) {
    const value = await this.findOne(filter)
    if (value) await this.write({ ...value, ...update, id: value.id })
  }

  async updateMany(filter: DocumentFilter<T>, update: Partial<T>) {
    const values = (await this.find({ filter })).items
    await Promise.all(values.map((value) => this.write({ ...value, ...update, id: value.id })))
  }

  async replaceOne(filter: DocumentFilter<T>, replacement: T) {
    const existing = await this.findOne(filter)
    await this.write(replacement)
    if (existing && existing.id !== replacement.id) await this.deleteOne({ id: existing.id } as DocumentFilter<T>)
  }

  async deleteOne(filter: DocumentFilter<T>) {
    const value = await this.findOne(filter)
    if (!value) return
    try {
      await rm(this.path(value.id), { force: true })
    } catch (error) {
      throw normalizeStorageError(error, 'delete-failed', `Could not delete document ${value.id}`)
    }
  }

  async deleteMany(filter: DocumentFilter<T>) {
    const values = (await this.find({ filter })).items
    await Promise.all(values.map((value) => this.deleteOne({ id: value.id } as DocumentFilter<T>)))
  }
}
