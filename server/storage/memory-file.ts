import { Readable } from 'node:stream'
import type { FileEngine } from './contracts'
import { assertStorageKey } from './contracts'

export class MemoryFileEngine implements FileEngine {
  private readonly files = new Map<string, Buffer>()
  async get(key: string) { return this.files.get(assertStorageKey(key)) ?? null }
  async put(key: string, value: Buffer | Uint8Array) { this.files.set(assertStorageKey(key), Buffer.from(value)) }
  async putStream(key: string, value: AsyncIterable<Uint8Array> | Readable) {
    const chunks: Uint8Array[] = []
    for await (const chunk of value) chunks.push(chunk)
    await this.put(key, Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))))
  }
  async remove(key: string) { this.files.delete(assertStorageKey(key)) }
  async list() { return [...this.files.keys()] }
  createReadStream(key: string) {
    const value = this.files.get(assertStorageKey(key))
    return Readable.from(value ? [value] : [])
  }
}
