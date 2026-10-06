import { describe, expect, it } from 'vitest'
import { initialGame } from '../../shared/utils/last-game'

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
