import { PassThrough } from 'node:stream'
import { fileTypeFromStream } from 'file-type'
import { usePhotoFiles } from '../../photos/repository'
import { photoMimeTypes } from '../../photos/utils'

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
  const source = await usePhotoFiles().getStream(name)
  if (!source) throw notFoundError

  setResponseHeader(event, 'Cache-Control', 'public, max-age=300')
  setResponseHeader(
    event,
    'Content-Type',
    photoMimeTypes[extension as keyof typeof photoMimeTypes] ?? 'application/octet-stream'
  )
  return source
})
