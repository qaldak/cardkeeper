import { describe, expect, it } from 'vitest'
import { assertOwner } from '../../server/lib/actor'

describe('assertOwner', () => {
  const anna = { id: 1, name: 'Anna' }

  it('lets the owner through', () => {
    expect(() => assertOwner({ ownerUserId: 1 }, anna)).not.toThrow()
  })

  it('refuses everybody else with 403', () => {
    expect(() => assertOwner({ ownerUserId: 2 }, anna)).toThrowError(expect.objectContaining({ status: 403, code: 'not_card_owner' }))
  })

  it('refuses everybody for a card without owner', () => {
    expect(() => assertOwner({ ownerUserId: null }, anna)).toThrowError(expect.objectContaining({ status: 403, code: 'card_has_no_owner' }))
  })
})
