import { createReadStream } from 'node:fs'
import { mkdir, open, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { FileEngine } from './contracts'
import { assertStorageKey, normalizeStorageError, StorageError } from './contracts'

export class FilesystemFileEngine implements FileEngine {
  constructor(private readonly directory: string) {}

  private path(key: string) {
    return join(this.directory, assertStorageKey(key))
  }

  async get(key: string) {
    try {
      return await (await import('node:fs/promises')).readFile(this.path(key))
    } catch (error: any) {
      if (error?.code === 'ENOENT') return null
      throw normalizeStorageError(error, 'read-failed', `Could not read file ${key}`)
    }
  }

  async put(key: string, value: Buffer | Uint8Array) {
    let temporary: string | undefined
    try {
      const path = this.path(key)
      await mkdir(join(this.directory, key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : ''), { recursive: true })
    temporary = `${path}.${process.pid}.${Date.now()}.tmp`
      await writeFile(temporary, value, { flag: 'wx' })
      await rename(temporary, path)
    temporary = undefined
    } catch (error) {
    if (temporary) await rm(temporary, { force: true }).catch(() => undefined)
    throw normalizeStorageError(error, 'write-failed', `Could not write file ${key}`)
    }
  }

  async putStream(key: string, value: AsyncIterable<Uint8Array> | import('node:stream').Readable) {
    let temporary: string | undefined
    try {
    const path = this.path(key)
    await mkdir(join(this.directory, key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : ''), { recursive: true })
    temporary = `${path}.${process.pid}.${Date.now()}.tmp`
    const handle = await open(temporary, 'wx')
    try {
      await pipeline(value, handle.createWriteStream())
      await handle.sync()
    } finally {
      await handle.close()
    }
    await rename(temporary, path)
    temporary = undefined
    } catch (error) {
    if (temporary) await rm(temporary, { force: true }).catch(() => undefined)
    throw normalizeStorageError(error, 'write-failed', `Could not write file ${key}`)
    }
  }

  async remove(key: string) {
    try {
      await rm(this.path(key), { force: true })
    } catch (error) {
      throw normalizeStorageError(error, 'delete-failed', `Could not delete file ${key}`)
    }
  }

  async list() {
    try {
      const walk = async (directory: string, prefix = ''): Promise<string[]> => {
        const entries = await readdir(directory, { withFileTypes: true })
        return (await Promise.all(entries.map((entry) => entry.isDirectory()
          ? walk(join(directory, entry.name), `${prefix}${entry.name}/`)
          : `${prefix}${entry.name}`))).flat()
      }
      return await walk(this.directory)
    } catch (error: any) {
      if (error?.code === 'ENOENT') return []
      throw normalizeStorageError(error, 'read-failed', 'Could not list files')
    }
  }

  createReadStream(key: string) {
    const path = this.path(key)
    const stream = createReadStream(path)
    stream.on('error', (error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        stream.destroy(new StorageError('not-found', `File not found: ${key}`))
      }
    })
    return stream
  }
}
