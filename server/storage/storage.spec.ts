import { describe, expect, it } from 'vitest'
import { MemoryDocumentEngine } from './documents/memory'
import { MemoryFileEngine } from './memory-file'
import { StorageError } from './contracts'

describe('storage engines', () => {
  it('isolates values written to the memory document engine', async () => {
    const engine = new MemoryDocumentEngine<{ id: string; nested: { value: number } }>()
    const value = { id: 'one', nested: { value: 1 } }
    await engine.set(value.id, value)
    value.nested.value = 2
    expect((await engine.get('one'))?.nested.value).toBe(1)
    expect(await engine.list()).toHaveLength(1)
  })

  it('stores binary files and validates unsafe keys', async () => {
    const engine = new MemoryFileEngine()
    await engine.put('images/one.bin', Buffer.from('ok'))
    expect((await engine.get('images/one.bin'))?.toString()).toBe('ok')
    await expect(engine.get('../secret')).rejects.toBeInstanceOf(StorageError)
    await engine.remove('images/one.bin')
    expect(await engine.get('images/one.bin')).toBeNull()
  })
})
