import { describe, expect, it } from 'vitest'
import { MemoryDocumentEngine } from '../../server/storage/documents/memory'
import { MemoryFileEngine } from '../../server/storage/memory-file'
import { StorageError } from '../../server/storage/contracts'

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

  it('stores binary files and validates unsafe keys', async () => {
    const engine = new MemoryFileEngine()
    await engine.put('images/one.bin', Buffer.from('ok'))
    expect((await engine.get('images/one.bin'))?.toString()).toBe('ok')
    await expect(Promise.resolve().then(() => engine.get('../secret'))).rejects.toBeInstanceOf(StorageError)
    await engine.remove('images/one.bin')
    expect(await engine.get('images/one.bin')).toBeNull()
  })
})
