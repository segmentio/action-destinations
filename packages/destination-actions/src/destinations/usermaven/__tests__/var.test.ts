import { generateId } from '../vars'

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string')
  })

  it('returns a string of length 10', () => {
    expect(generateId().length).toBe(10)
  })
})
