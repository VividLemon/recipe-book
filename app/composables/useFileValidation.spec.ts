import { describe, expect, it } from 'vitest'
import { usePhotoFileValidation } from './useFileValidation'

describe('usePhotoFileValidation', () => {
  it('accepts an optional configured image file', () => {
    const schema = usePhotoFileValidation({ acceptedType: ['image/png'] })(true)
    expect(schema.safeParse(null).success).toBe(true)
    expect(schema.safeParse(new File(['image'], 'photo.png', { type: 'image/png' })).success).toBe(true)
  })

  it('rejects files with an unacceptable mime type', () => {
    const schema = usePhotoFileValidation({ acceptedType: ['image/png'] })(true)
    expect(schema.safeParse(new File(['text'], 'file.txt', { type: 'text/plain' })).success).toBe(false)
  })
})
