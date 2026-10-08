import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MemoryDocumentEngine } from '../../server/storage/documents/memory'
import { FilesystemDocumentEngine } from '../../server/storage/documents/filesystem'
import { MemoryFileEngine } from '../../server/storage/memory-file'
import { StorageError, type DocumentEngine } from '../../server/storage/contracts'
import { createStorageRepositories } from '../../server/storage/container'

type TestDocument = { id: string; group: string; rank: number; active?: boolean }

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

const exerciseDocumentEngine = async (engine: DocumentEngine<TestDocument>) => {
  await engine.insertMany([
    { id: 'one', group: 'a', rank: 2 },
    { id: 'two', group: 'a', rank: 1 },
    { id: 'three', group: 'b', rank: 3 }
  ])
  expect(await engine.find({
    filter: { group: 'a' },
    sort: [{ field: 'rank', direction: 'asc' }],
    limit: 1
  })).toEqual({
    items: [{ id: 'two', group: 'a', rank: 1 }],
    total: 2,
    offset: 0,
    limit: 1
  })
  await engine.updateOne({ id: 'one' }, { active: true })
  await engine.updateMany({ group: 'a' }, { active: false })
  expect(await engine.findOne({ id: 'one' })).toEqual({
    id: 'one', group: 'a', rank: 2, active: false
  })
  await engine.replaceOne({ id: 'one' }, { id: 'one', group: 'c', rank: 4 })
  expect(await engine.findOne({ id: 'one' })).toEqual({ id: 'one', group: 'c', rank: 4 })
  await engine.deleteOne({ id: 'two' })
  await engine.deleteMany({ group: 'b' })
  expect((await engine.find()).items.map(({ id }) => id)).toEqual(['one'])
}

describe('storage engines', () => {
  it('supports document CRUD and paging in memory', async () => {
    await exerciseDocumentEngine(new MemoryDocumentEngine<TestDocument>())
  })

  it('supports document CRUD and paging across filesystem engine instances', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'recipe-book-documents-'))
    temporaryDirectories.push(directory)
    const firstInstance = new FilesystemDocumentEngine<TestDocument>(directory)
    const secondInstance = new FilesystemDocumentEngine<TestDocument>(directory)

    await firstInstance.insertMany([
      { id: 'one', group: 'a', rank: 2 },
      { id: 'two', group: 'a', rank: 1 },
      { id: 'three', group: 'b', rank: 3 }
    ])
    expect((await secondInstance.find({ filter: { group: 'a' } })).total).toBe(2)
    await exerciseDocumentEngine(new FilesystemDocumentEngine<TestDocument>(join(directory, 'crud')))
  })

  it('supports compound visibility and case-insensitive search filters', async () => {
    const engine = new MemoryDocumentEngine<{
      id: string
      ownerId: string
      isPublic: boolean
      name: string
    }>()
    await engine.insertMany([
      { id: 'one', ownerId: 'user-1', isPublic: false, name: 'Private tart' },
      { id: 'two', ownerId: 'user-2', isPublic: true, name: 'Apple pie' },
      { id: 'three', ownerId: 'user-2', isPublic: true, name: 'Apple cake' }
    ])

    const page = await engine.find({
      filter: {
        $and: [
          { $or: [{ isPublic: { $ne: false } }, { ownerId: 'user-1' }] },
          { name: { $regex: '^apple', $options: 'i' } }
        ]
      },
      limit: 1
    })

    expect(page.items.map((item) => item.id)).toEqual(['two'])
    expect(page.total).toBe(2)
  })

  it('stores binary files and validates unsafe keys', async () => {
    const engine = new MemoryFileEngine()
    await engine.put('images/one.bin', Buffer.from('ok'))
    expect((await engine.get('images/one.bin'))?.toString()).toBe('ok')
    await expect(Promise.resolve().then(() => engine.get('../secret'))).rejects.toBeInstanceOf(StorageError)
    await engine.remove('images/one.bin')
    expect(await engine.get('images/one.bin')).toBeNull()
  })

  it('stores account records in the configured document backend', async () => {
    const repositories = createStorageRepositories({
      documentBackend: 'memory',
      fileBackend: 'memory'
    })
    const user = {
      id: 'user-1',
      username: 'recipe-user',
      email: 'recipe@example.test',
      passwordHash: 'scrypt-hash',
      favorites: ['recipe-1']
    }

    await repositories.users.replaceOne({ id: user.id }, user)
    expect(await repositories.users.findOne({ id: user.id })).toEqual(user)
  })
})
