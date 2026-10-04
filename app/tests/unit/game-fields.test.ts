import { describe, expect, it } from 'vitest'
import { formatAttributeValue, getAttributeFields, parseAttributeInput } from '../../shared/utils/game-fields'

describe('game attribute fields', () => {
  it('defines the editable Yu-Gi-Oh! attributes', () => {
    expect(getAttributeFields('ygo').map(field => field.key)).toEqual(['atk', 'def', 'level', 'type', 'race', 'attribute'])
  })

  it('returns no fields for an unknown game', () => {
    expect(getAttributeFields('unknown')).toEqual([])
  })

  it('parses number input', () => {
    expect(parseAttributeInput('number', ' 2500 ')).toBe(2500)
    expect(parseAttributeInput('number', '-1')).toBe(-1)
    expect(parseAttributeInput('number', '?')).toBe(-1)
    expect(parseAttributeInput('number', '')).toBeNull()
    expect(parseAttributeInput('number', 'abc')).toBeUndefined()
    expect(parseAttributeInput('number', '12.5')).toBeUndefined()
  })

  it('keeps text input as is', () => {
    expect(parseAttributeInput('text', ' Spellcaster ')).toBe('Spellcaster')
    expect(parseAttributeInput('text', '  ')).toBeNull()
  })

  it('formats stored values for inputs', () => {
    expect(formatAttributeValue('number', 2500)).toBe('2500')
    expect(formatAttributeValue('number', -1)).toBe('?')
    expect(formatAttributeValue('text', 'DARK')).toBe('DARK')
    expect(formatAttributeValue('text', null)).toBe('')
    expect(formatAttributeValue('number', undefined)).toBe('')
  })
})
