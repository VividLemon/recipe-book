import type { RecipeData, RecipeTagData } from '../../types/recipe'
import { normalizeStorageError, type DocumentEngine, type DocumentPage, type DocumentQuery, type FileEngine } from './contracts'

export class DocumentRepository<T extends { id: string }> {
  constructor(private readonly engine: DocumentEngine<T>) {}
  async get(id: string) {
    try { return await this.engine.get(id) } catch (error) {
      throw normalizeStorageError(error, 'read-failed', `Could not read document ${id}`)
    }
  }
  async list(query?: DocumentQuery<T>) {
    try { return await this.engine.list(query) } catch (error) {
      throw normalizeStorageError(error, 'read-failed', 'Could not list documents')
    }
  }
  async page(query?: DocumentQuery<T>): Promise<DocumentPage<T>> {
    try { return await this.engine.page(query) } catch (error) {
      throw normalizeStorageError(error, 'read-failed', 'Could not page documents')
    }
  }
  async set(value: T) {
    try { await this.engine.set(value.id, value) } catch (error) {
      throw normalizeStorageError(error, 'write-failed', `Could not write document ${value.id}`)
    }
  }
  async remove(id: string) {
    try { await this.engine.remove(id) } catch (error) {
      throw normalizeStorageError(error, 'delete-failed', `Could not delete document ${id}`)
    }
  }
}

export interface StorageRepositories {
  recipes: DocumentRepository<RecipeData>
  recipeTags: DocumentRepository<RecipeTagData>
  photos: FileEngine
}
