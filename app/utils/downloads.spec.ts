import { describe, expect, it } from 'vitest'
import { toCSVBlob, toJSONBlob } from './downloads'

describe('download serializers', () => {
  it('creates JSON blobs', async () => {
    const blob = toJSONBlob([{ name: 'Soup' }], { human: true })
    expect(blob.type).toBe('application/json')
    expect(await blob.text()).toContain('"name": "Soup"')
  })

  it('creates CSV blobs with headers', async () => {
    const blob = toCSVBlob([{ name: 'Soup', time: 20 }])
    expect(blob.type).toBe('text/csv')
    expect(await blob.text()).toBe('name,time\nSoup,20')
  })
})
