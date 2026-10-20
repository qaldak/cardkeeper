import { describe, expect, it } from 'vitest'
import { ALL_OWNERS, overviewOwner, rememberedQuery } from '../../shared/utils/overview-query'

describe('overviewOwner', () => {
  it('defaults to the logged in user', () => {
    expect(overviewOwner(undefined, 7)).toBe('7')
    expect(overviewOwner('', 7)).toBe('7')
  })

  it('shows all owners only when the url asks for it', () => {
    expect(overviewOwner(ALL_OWNERS, 7)).toBeUndefined()
  })

  it('takes the owner of the url, also "none"', () => {
    expect(overviewOwner('3', 7)).toBe('3')
    expect(overviewOwner('none', 7)).toBe('none')
  })

  it('shows all owners while nobody is known', () => {
    expect(overviewOwner(undefined, null)).toBeUndefined()
    expect(overviewOwner(undefined, undefined)).toBeUndefined()
  })
})

describe('rememberedQuery', () => {
  it('keeps the strings', () => {
    expect(rememberedQuery({ game: 'ygo', owner: 'all', sort: 'price' })).toEqual({ game: 'ygo', owner: 'all', sort: 'price' })
  })

  it('drops everything that is no string, and is null when nothing is left', () => {
    expect(rememberedQuery({ game: 'ygo', page: 3, empty: '' })).toEqual({ game: 'ygo' })
    expect(rememberedQuery({ page: 3 })).toBeNull()
    expect(rememberedQuery({})).toBeNull()
  })

  it('is null for anything that is no object', () => {
    for (const value of [null, undefined, 'x', 5, ['a']]) {
      expect(rememberedQuery(value)).toBeNull()
    }
  })
})
