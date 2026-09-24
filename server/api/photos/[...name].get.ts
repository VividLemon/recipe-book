import { fileTypeFromBuffer } from 'file-type'
import { usePhotoFiles } from '../../utils/storage'

/**
 * Serves a photo out of the configured file engine. Since the storage backend is
 * pluggable (filesystem or memory), photos are never served directly
 * as static files - they always go through this route.
 */
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  // Defense in depth: reject any traversal/absolute-path attempt before it
  // ever reaches a storage driver (not all drivers guard against `..`
  // segments or leading slashes the same way).
  if (!name || name.includes('..') || name.startsWith('/')) throw notFoundError

  const raw = await usePhotoFiles().get(name)
  if (!raw) throw notFoundError

  const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw)
  const type = await fileTypeFromBuffer(buffer)
  setResponseHeader(event, 'Content-Type', type?.mime ?? 'application/octet-stream')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return buffer
})
