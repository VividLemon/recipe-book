import type { Readable } from 'node:stream'

export type StorageId = string

export interface DocumentQuery<T> {
  offset?: number
  limit?: number
  filter?: Partial<T>
  sortBy?: keyof T
  sortDirection?: 'asc' | 'desc'
}

export interface DocumentPage<T> {
  items: T[]
  total: number
  offset: number
  limit?: number
}

export interface DocumentEngine<T> {
  get(id: StorageId): Promise<T | null>
  list(query?: DocumentQuery<T>): Promise<T[]>
  page(query?: DocumentQuery<T>): Promise<DocumentPage<T>>
  set(id: StorageId, value: T): Promise<void>
  remove(id: StorageId): Promise<void>
}

export interface FileEngine {
  get(key: string): Promise<Buffer | null>
  put(key: string, value: Buffer | Uint8Array): Promise<void>
  putStream(key: string, value: AsyncIterable<Uint8Array> | Readable): Promise<void>
  remove(key: string): Promise<void>
  list(): Promise<string[]>
  createReadStream(key: string): Readable
}

export type StorageErrorCode =
  | 'not-found'
  | 'invalid-key'
  | 'read-failed'
  | 'write-failed'
  | 'delete-failed'
  | 'configuration'

export class StorageError extends Error {
  constructor(
    readonly code: StorageErrorCode,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options)
    this.name = 'StorageError'
  }
}

export const normalizeStorageError = (
  error: unknown,
  code: StorageErrorCode,
  message: string
) => error instanceof StorageError
  ? error
  : new StorageError(code, message, { cause: error })

export const assertStorageKey = (key: string) => {
  if (!key || key.startsWith('/') || key.includes('\0') || key.includes('\\') || key.split('/').some((part) => part === '..' || part === '.')) {
    throw new StorageError('invalid-key', `Invalid storage key: ${key}`)
  }
  return key
}
