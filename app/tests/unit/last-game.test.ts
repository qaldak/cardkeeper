import { describe, expect, it } from 'vitest'
import { initialGame, overviewGame } from '../../shared/utils/last-game'

describe('initialGame', () => {
  const games = ['ygo', 'pokemon']

  it('starts with the first game when nothing was chosen yet', () => {
    expect(initialGame(games, null)).toBe('ygo')
    expect(initialGame(games, undefined)).toBe('ygo')
    expect(initialGame(games, '')).toBe('ygo')
  })

  it('keeps the game that was chosen last', () => {
    expect(initialGame(games, 'pokemon')).toBe('pokemon')
  })

  it('ignores a remembered game that is not registered (any more)', () => {
    expect(initialGame(games, 'mtg')).toBe('ygo')
  })

  it('is empty without any game', () => {
    expect(initialGame([], 'pokemon')).toBe('')
  })
})

describe('overviewGame', () => {
  const games = ['ygo', 'pokemon']

  it('shows all games by default', () => {
    expect(overviewGame(games, undefined, undefined)).toBeUndefined()
    expect(overviewGame(games, '', null)).toBeUndefined()
  })

  it('shows the game that was chosen last', () => {
    expect(overviewGame(games, undefined, 'pokemon')).toBe('pokemon')
    expect(overviewGame(games, undefined, 'all')).toBeUndefined()
  })

  it('prefers the url over the remembered game', () => {
    expect(overviewGame(games, 'ygo', 'pokemon')).toBe('ygo')
    expect(overviewGame(games, 'all', 'pokemon')).toBeUndefined()
  })

  it('ignores games that are not registered', () => {
    expect(overviewGame(games, 'mtg', 'pokemon')).toBe('pokemon')
    expect(overviewGame(games, undefined, 'mtg')).toBeUndefined()
  })

  it('shows the only game when there is just one', () => {
    expect(overviewGame(['ygo'], undefined, undefined)).toBe('ygo')
    expect(overviewGame(['ygo'], 'all', 'all')).toBe('ygo')
  })

  it('has nothing to show without a game', () => {
    expect(overviewGame([], undefined, 'pokemon')).toBeUndefined()
  })
})
