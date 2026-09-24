import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { DocumentEngine, DocumentPage, DocumentQuery, StorageId } from '../contracts'
import { assertStorageKey, normalizeStorageError } from '../contracts'

export class FilesystemDocumentEngine<T> implements DocumentEngine<T> {
  constructor(private readonly directory: string) {}

  private path(id: StorageId) {
    return join(this.directory, `${assertStorageKey(id)}.json`)
  }

  async get(id: StorageId) {
    try {
      return JSON.parse(await readFile(this.path(id), 'utf8')) as T
    } catch (error: any) {
      if (error?.code === 'ENOENT') return null
      throw normalizeStorageError(error, 'read-failed', `Could not read document ${id}`)
    }
  }

  async list(query?: DocumentQuery<T>) {
    return (await this.page(query)).items
  }

  async page(query: DocumentQuery<T> = {}): Promise<DocumentPage<T>> {
    try {
      const entries = await readdir(this.directory, { withFileTypes: true })
      let values = (await Promise.all(entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => this.get(entry.name.slice(0, -5)))))
        .filter((value): value is T => value !== null)
      if (query.filter) values = values.filter((value) => Object.entries(query.filter!).every(([key, expected]) => value[key as keyof T] === expected))
      if (query.sortBy) {
        const key = query.sortBy
        values.sort((a, b) => String(a[key]).localeCompare(String(b[key])) * (query.sortDirection === 'desc' ? -1 : 1))
      }
      const offset = Math.max(0, query.offset ?? 0)
      return { items: values.slice(offset, query.limit === undefined ? undefined : offset + Math.max(0, query.limit)), total: values.length, offset, limit: query.limit }
    } catch (error: any) {
      if (error?.code === 'ENOENT') return []
      throw normalizeStorageError(error, 'read-failed', 'Could not list documents')
    }
  }

  async set(id: StorageId, value: T) {
    try {
      await mkdir(this.directory, { recursive: true })
      const destination = this.path(id)
      const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`
      await writeFile(temporary, JSON.stringify(value), { encoding: 'utf8', flag: 'wx' })
      await rename(temporary, destination)
    } catch (error) {
      throw normalizeStorageError(error, 'write-failed', `Could not write document ${id}`)
    }
  }

  async remove(id: StorageId) {
    try {
      await rm(this.path(id), { force: true })
    } catch (error) {
      throw normalizeStorageError(error, 'delete-failed', `Could not delete document ${id}`)
    }
  }
}
