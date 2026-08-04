import { resolveIdentifiers, convertAttributeTimestamps } from '../utils'

describe('resolveIdentifiers', () => {
  it('should return object_id and object_type_id if both are provided', () => {
    const identifiers = { object_id: '123', object_type_id: '456' }

    expect(resolveIdentifiers(identifiers)).toEqual(identifiers)
  })

  it('should return cio_id if person_id starts with "cio_"', () => {
    const identifiers = { person_id: 'cio_123' }

    expect(resolveIdentifiers(identifiers)).toEqual({ cio_id: '123' })
  })

  it('should return email if person_id is a valid email', () => {
    const identifiers = { person_id: 'test@example.com' }

    expect(resolveIdentifiers(identifiers)).toEqual({ email: 'test@example.com' })
  })

  it('should return id if person_id is provided', () => {
    const identifiers = { person_id: '123' }

    expect(resolveIdentifiers(identifiers)).toEqual({ id: '123' })
  })

  it('should return email if email is provided', () => {
    const identifiers = { email: 'test@example.com' }

    expect(resolveIdentifiers(identifiers)).toEqual({ email: 'test@example.com' })
  })

  it('should return anonymous_id if anonymous_id is provided', () => {
    const identifiers = { anonymous_id: '123' }

    expect(resolveIdentifiers(identifiers)).toEqual({ anonymous_id: '123' })
  })

  it('should return undefined if no identifiers are provided', () => {
    expect(resolveIdentifiers({})).toBeUndefined()
  })
})

describe('convertAttributeTimestamps — fractional second variants', () => {
  it('converts a 7-digit fractional second ISO timestamp to unix', () => {
    const result = convertAttributeTimestamps({ createdat: '2024-08-14T20:36:48.6527521Z' })
    expect(result.createdat).toBe(1723667808)
  })

  it('converts a 9-digit fractional second ISO timestamp to unix', () => {
    const result = convertAttributeTimestamps({ createdat: '2024-08-14T20:36:48.652752100Z' })
    expect(result.createdat).toBe(1723667808)
  })

  it('does not regress on 3-digit millisecond timestamps', () => {
    const result = convertAttributeTimestamps({ createdat: '2024-08-14T20:36:48.652Z' })
    expect(result.createdat).toBe(1723667808)
  })

  it('does not convert non-date strings', () => {
    const result = convertAttributeTimestamps({ name: 'hello' })
    expect(result.name).toBe('hello')
  })
})
