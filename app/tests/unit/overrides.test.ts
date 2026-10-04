import { describe, expect, it } from 'vitest'
import { recordOverrides } from '../../server/lib/overrides'

describe('recordOverrides', () => {
  it('remembers the original value on the first manual edit', () => {
    const result = recordOverrides({}, [{ field: 'name', oldValue: 'Dark Magician', newValue: 'Dunkler Magier' }])
    expect(result).toEqual({ name: 'Dark Magician' })
  })

  it('keeps the first original value on repeated edits', () => {
    const existing = { name: 'Dark Magician' }
    const result = recordOverrides(existing, [{ field: 'name', oldValue: 'Dunkler Magier', newValue: 'Magier' }])
    expect(result).toEqual({ name: 'Dark Magician' })
  })

  it('removes the override when the value is edited back to the original', () => {
    const existing = { name: 'Dark Magician' }
    const result = recordOverrides(existing, [{ field: 'name', oldValue: 'Magier', newValue: 'Dark Magician' }])
    expect(result).toEqual({})
  })

  it('stores null for an attribute that did not exist before', () => {
    const result = recordOverrides({}, [{ field: 'attributes.level', oldValue: undefined, newValue: 4 }])
    expect(result).toEqual({ 'attributes.level': null })
  })

  it('ignores no-op changes and does not mutate its input', () => {
    const existing = { name: 'A' }
    const result = recordOverrides(existing, [{ field: 'description', oldValue: 'x', newValue: 'x' }])
    expect(result).toEqual({ name: 'A' })
    expect(result).not.toBe(existing)
  })
})
