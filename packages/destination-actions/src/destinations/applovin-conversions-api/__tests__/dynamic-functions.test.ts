import { searchCategories } from '../sendEvent/dynamic-functions'

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
