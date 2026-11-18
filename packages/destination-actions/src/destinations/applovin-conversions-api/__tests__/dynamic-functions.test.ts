import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { searchCategories } from '../sendEvent/dynamic-functions'

const testDestination = createTestIntegration(Destination)

const labels = async (payload: object = {}, field = 'items.item_category_id') => {
  process.env.ACTIONS_APPLOVIN_CONVERSIONS_API_KEY = 'test-key'
  const response = await testDestination.executeDynamicField('sendEvent', field, {
    settings: { pixel_id: 'pixel' },
    payload
  } as never)
  return response.choices.map(({ label }) => label)
}

describe('searchCategories', () => {
  it('returns the top-level categories for an empty query', () => {
    const choices = searchCategories('')
    expect(choices).toContainEqual({ label: '166 (Apparel & Accessories)', value: '166 (Apparel & Accessories)' })
    expect(choices.every(({ label }) => !label.includes('>'))).toBe(true)
  })

  it('matches on number or text, case-insensitively, and returns at most 50', () => {
    expect(searchCategories('166').map(({ value }) => value)).toContain('166 (Apparel & Accessories)')
    expect(searchCategories('SHIRTS & TOPS').length).toBeGreaterThan(0)
    expect(searchCategories('a')).toHaveLength(50)
    expect(searchCategories('zzzzzz-nope')).toEqual([])
  })
})

describe('item_category_id dynamic field', () => {
  it('searches on the text typed into the selected item', async () => {
    const payload = { items: [{ item_id: 'a' }, { item_category_id: 'Live Animals' }] }
    expect(await labels(payload, 'items.[1].item_category_id')).toEqual([
      '3237 (Animals & Pet Supplies > Live Animals)'
    ])
  })

  it('uses the first item when no array index is sent', async () => {
    expect(await labels({ items: [{ item_category_id: 'Live Animals' }] })).toEqual([
      '3237 (Animals & Pet Supplies > Live Animals)'
    ])
  })

  it('returns the top-level categories when nothing was typed or items is not an array', async () => {
    expect(await labels({ items: '' })).toContain('1 (Animals & Pet Supplies)')
    expect(await labels({})).toContain('166 (Apparel & Accessories)')
  })
})
