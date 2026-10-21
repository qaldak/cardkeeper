import { describe, expect, it } from 'vitest'
import { ALL_OWNERS, cardLinkQuery, hasCardNavigation, navApiQuery, overviewOwner, overviewQueryOf, rememberedQuery } from '../../shared/utils/overview-query'

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

describe('card links', () => {
  const state = { game: 'ygo', owner: '4', q: 'magier', sort: 'name', dir: 'asc', rarity: undefined, levelMin: 3, page: 2 }

  it('carry the filters and the sort order, not the page', () => {
    expect(cardLinkQuery(state)).toEqual({ nav: '1', game: 'ygo', owner: '4', q: 'magier', sort: 'name', dir: 'asc', levelMin: '3' })
  })

  it('write all games and all owners out, as the url has no value for them', () => {
    expect(cardLinkQuery({ game: undefined, owner: undefined, sort: 'created' })).toEqual({ nav: '1', game: 'all', owner: 'all', sort: 'created' })
  })

  it('are recognized by nav=1', () => {
    expect(hasCardNavigation({ nav: '1' })).toBe(true)
    expect(hasCardNavigation({})).toBe(false)
    expect(hasCardNavigation({ nav: '0' })).toBe(false)
  })

  it('become the list query of the neighbours, without the "all" values and the marker', () => {
    expect(navApiQuery({ nav: '1', game: 'all', owner: 'all', q: 'magier', sort: 'price', dir: 'desc', page: '3' }))
      .toEqual({ q: 'magier', sort: 'price', dir: 'desc' })
    expect(navApiQuery({ nav: '1', game: 'pokemon', owner: '2' })).toEqual({ game: 'pokemon', owner: '2' })
  })

  it('lead back to the overview page that shows the card', () => {
    const query = { nav: '1', game: 'all', owner: 'all', q: 'x', sort: 'name' }
    expect(overviewQueryOf(query, 3)).toEqual({ game: 'all', owner: 'all', q: 'x', sort: 'name', page: '3' })
    expect(overviewQueryOf(query, 1)).toEqual({ game: 'all', owner: 'all', q: 'x', sort: 'name' })
    expect(overviewQueryOf(query, null)).toEqual({ game: 'all', owner: 'all', q: 'x', sort: 'name' })
  })
})
