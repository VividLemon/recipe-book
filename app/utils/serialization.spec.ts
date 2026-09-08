import { describe, expect, it } from 'vitest'
import { deserializeFormData, objToFormData } from './serialization'

describe('form data serialization', () => {
  it('serializes a body and non-null files', () => {
    const file = new File(['data'], 'photo.txt', { type: 'text/plain' })
    const result = objToFormData({ body: { name: 'Soup' }, files: { photo: file, empty: null } })
    expect(result.get('body')).toBe(JSON.stringify({ name: 'Soup' }))
    expect(result.get('file_photo')).toBe(file)
    expect(result.get('file_empty')).toBeNull()
  })

  it('deserializes body and prefixed file fields', () => {
    const file = new File(['data'], 'photo.txt')
    expect(deserializeFormData([
      { name: 'body', data: JSON.stringify({ name: 'Soup' }) },
      { name: 'file_photo', data: file }
    ] as never)).toEqual({ name: 'Soup', photo: file })
  })
})
