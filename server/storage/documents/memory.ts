import type { DocumentEngine, StorageId } from '../contracts'

export class MemoryDocumentEngine<T> implements DocumentEngine<T> {
  private readonly documents = new Map<StorageId, T>()

  async get(id: StorageId) {
    return this.documents.get(id) ?? null
  }

  async list() {
    return [...this.documents.values()]
  }

  async set(id: StorageId, value: T) {
    this.documents.set(id, structuredClone(value))
  }

  async remove(id: StorageId) {
    this.documents.delete(id)
  }
}
