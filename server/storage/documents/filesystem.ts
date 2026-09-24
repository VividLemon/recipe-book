import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { DocumentEngine, StorageId } from '../contracts'
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

  async list() {
    try {
      const entries = await readdir(this.directory, { withFileTypes: true })
      return (await Promise.all(entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => this.get(entry.name.slice(0, -5)))))
        .filter((value): value is T => value !== null)
    } catch (error: any) {
      if (error?.code === 'ENOENT') return []
      throw normalizeStorageError(error, 'read-failed', 'Could not list documents')
    }
  }

  async set(id: StorageId, value: T) {
    try {
      await mkdir(this.directory, { recursive: true })
      await writeFile(this.path(id), JSON.stringify(value), 'utf8')
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
