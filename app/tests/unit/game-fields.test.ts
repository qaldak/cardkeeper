import { describe, expect, it } from 'vitest'
import { formatAttributeValue, getAttributeFields } from '../../shared/utils/game-fields'

describe('game attribute fields', () => {
  it('defines the editable Yu-Gi-Oh! attributes', () => {
    expect(getAttributeFields('ygo').map(field => field.key)).toEqual(['atk', 'def', 'level', 'type', 'race', 'attribute'])
  })

  it('returns no fields for an unknown game', () => {
    expect(getAttributeFields('unknown')).toEqual([])
  })

  it('formats stored values for display', () => {
    expect(formatAttributeValue('number', 2500)).toBe('2500')
    expect(formatAttributeValue('number', -1)).toBe('?')
    expect(formatAttributeValue('text', 'DARK')).toBe('DARK')
    expect(formatAttributeValue('text', null)).toBe('')
    expect(formatAttributeValue('number', undefined)).toBe('')
  })
})
