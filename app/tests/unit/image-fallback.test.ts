import { describe, expect, it } from 'vitest'
import { imageCandidates } from '../../shared/utils/image-fallback'

describe('imageCandidates', () => {
  it('tries png after a webp image', () => {
    expect(imageCandidates('https://assets.tcgdex.net/univ/tk/tk-hs-r/symbol.webp')).toEqual([
      'https://assets.tcgdex.net/univ/tk/tk-hs-r/symbol.webp',
      'https://assets.tcgdex.net/univ/tk/tk-hs-r/symbol.png',
    ])
  })

  it('has no second chance for other formats', () => {
    expect(imageCandidates('https://assets.tcgdex.net/a/b.png')).toEqual(['https://assets.tcgdex.net/a/b.png'])
  })
})
