import { describe, expect, it } from 'vitest'
import { MemoryDocumentEngine } from '../../server/storage/documents/memory'
import { MemoryFileEngine } from '../../server/storage/memory-file'
import { StorageError } from '../../server/storage/contracts'
import { createStorageRepositories } from '../../server/storage/container'

describe('storage engines', () => {
  it('supports filtering and pagination in memory', async () => {
    const engine = new MemoryDocumentEngine<{ id: string; group: string }>()
    await engine.set('one', { id: 'one', group: 'a' })
    await engine.set('two', { id: 'two', group: 'b' })
    expect(await engine.page({ filter: { group: 'a' }, limit: 1 })).toEqual({
      items: [{ id: 'one', group: 'a' }],
      total: 1,
      offset: 0,
      limit: 1
    })
  })

  it('supports visibility filters, case-insensitive search, and favorite ranking', async () => {
      const engine = new MemoryDocumentEngine<{
        id: string
        ownerId: string
        isPublic: boolean
        name: string
      }>()
      await engine.set('one', { id: 'one', ownerId: 'user-1', isPublic: false, name: 'Private tart' })
      await engine.set('two', { id: 'two', ownerId: 'user-2', isPublic: true, name: 'Apple pie' })
      await engine.set('three', { id: 'three', ownerId: 'user-2', isPublic: true, name: 'Apple cake' })

      const page = await engine.page({
        filter: {
          $and: [
            { $or: [{ isPublic: { $ne: false } }, { ownerId: 'user-1' }] },
            { name: { $regex: '^apple', $options: 'i' } }
          ]
        },
        favoriteIds: ['three'],
        limit: 1
      })

      expect(page.items.map((item) => item.id)).toEqual(['three'])
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

    await repositories.users.set(user)
    expect(await repositories.users.get(user.id)).toEqual(user)
  })
})
