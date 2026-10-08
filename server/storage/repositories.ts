import type { RecipeData } from '../recipes/types'
import type { RecipeTagData } from '../recipe-tags/types'
import type { UserData } from '../users/types'
import { normalizeStorageError, type DocumentEngine, type DocumentFilter, type DocumentPage, type DocumentQuery, type FileEngine } from './contracts'

export class DocumentRepository<T extends { id: string }> {
  constructor(private readonly engine: DocumentEngine<T>) {}

  async insertOne(value: T) {
    try { await this.engine.insertOne(value) } catch (error) {
      throw normalizeStorageError(error, 'write-failed', `Could not insert document ${value.id}`)
    }
  }

  async insertMany(values: T[]) {
    try { await this.engine.insertMany(values) } catch (error) {
      throw normalizeStorageError(error, 'write-failed', 'Could not insert documents')
    }
  }

  async find(query?: DocumentQuery<T>): Promise<DocumentPage<T>> {
    try { return await this.engine.find(query) } catch (error) {
      throw normalizeStorageError(error, 'read-failed', 'Could not find documents')
    }
  }

  async findOne(filter: DocumentFilter<T>) {
    try { return await this.engine.findOne(filter) } catch (error) {
      throw normalizeStorageError(error, 'read-failed', 'Could not find document')
    }
  }

  async updateOne(filter: DocumentFilter<T>, update: Partial<T>) {
    try { await this.engine.updateOne(filter, update) } catch (error) {
      throw normalizeStorageError(error, 'write-failed', 'Could not update document')
    }
  }

  async updateMany(filter: DocumentFilter<T>, update: Partial<T>) {
    try { await this.engine.updateMany(filter, update) } catch (error) {
      throw normalizeStorageError(error, 'write-failed', 'Could not update documents')
    }
  }

  async replaceOne(filter: DocumentFilter<T>, replacement: T) {
    try { await this.engine.replaceOne(filter, replacement) } catch (error) {
      throw normalizeStorageError(error, 'write-failed', `Could not replace document ${replacement.id}`)
    }
  }

  async deleteOne(filter: DocumentFilter<T>) {
    try { await this.engine.deleteOne(filter) } catch (error) {
      throw normalizeStorageError(error, 'delete-failed', 'Could not delete document')
    }
  }

  async deleteMany(filter: DocumentFilter<T>) {
    try { await this.engine.deleteMany(filter) } catch (error) {
      throw normalizeStorageError(error, 'delete-failed', 'Could not delete documents')
    }
  }
}

export interface StorageRepositories {
  recipes: DocumentRepository<RecipeData>
  recipeTags: DocumentRepository<RecipeTagData>
  users: DocumentRepository<UserData>
  photos: FileEngine
}
