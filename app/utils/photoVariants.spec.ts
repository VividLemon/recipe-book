import { describe, expect, it } from 'vitest'
import {
  buildPhotoVariantKeys,
  buildStepPhotoKey,
  listImageVariantUrls,
  normalizeImageVariants
} from './photoVariants'

describe('photoVariants', () => {
  it('normalizes legacy URL strings into variant objects', () => {
    expect(normalizeImageVariants('/api/photos/a.jpg')).toEqual({
      original: '/api/photos/a.jpg',
      webp: '/api/photos/a.jpg',
      avif: '/api/photos/a.jpg'
    })
  })

  it('returns all URLs from a variant object', () => {
    expect(
      listImageVariantUrls({
        original: '/api/photos/a.jpg',
        webp: '/api/photos/a.webp',
        avif: '/api/photos/a.avif'
      })
    ).toEqual(['/api/photos/a.jpg', '/api/photos/a.webp', '/api/photos/a.avif'])
  })

  it('builds deterministic keys for variant and step storage paths', () => {
    expect(
      buildPhotoVariantKeys({
        baseName: 'abc123',
        role: 'cover-default',
        originalExt: 'PNG'
      })
    ).toEqual({
      original: 'recipe_photo_v2/abc123/cover-default/original.png',
      webp: 'recipe_photo_v2/abc123/cover-default/webp.webp',
      avif: 'recipe_photo_v2/abc123/cover-default/avif.avif'
    })
    expect(buildStepPhotoKey('abc123', 'JpEg')).toBe(
      'recipe_photo_v2/abc123/step/original.jpeg'
    )
  })
})
