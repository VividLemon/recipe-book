import { usePhotoFiles } from '../../photos/repository'

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

  const extension = name.split('.').pop()?.toLowerCase()
  const contentTypes: Record<string, string> = {
    avif: 'image/avif',
    webp: 'image/webp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif'
  }
  const stream = await usePhotoFiles().getStream(name)
  if (!stream) throw notFoundError
  setResponseHeader(event, 'Content-Type', contentTypes[extension ?? ''] ?? 'application/octet-stream')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return stream
})
