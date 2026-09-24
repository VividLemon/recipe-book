import type { Readable } from 'node:stream'

export type StorageId = string

export interface DocumentEngine<T> {
  get(id: StorageId): Promise<T | null>
  list(): Promise<T[]>
  set(id: StorageId, value: T): Promise<void>
  remove(id: StorageId): Promise<void>
}

export interface FileEngine {
  get(key: string): Promise<Buffer | null>
  put(key: string, value: Buffer | Uint8Array): Promise<void>
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
  if (!key || key.startsWith('/') || key.split('/').includes('..')) {
    throw new StorageError('invalid-key', `Invalid storage key: ${key}`)
  }
  return key
}
