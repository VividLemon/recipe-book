import { describe, expect, it } from 'vitest'
import { chunkArray } from './arrays'

describe('chunkArray', () => {
  it('splits arrays into chunks and preserves the remainder', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('uses a chunk size of one for non-positive sizes', () => {
    expect(chunkArray(['a', 'b'], 0)).toEqual([['a'], ['b']])
  })
})
