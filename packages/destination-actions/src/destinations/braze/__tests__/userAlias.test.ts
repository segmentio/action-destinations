import { isValidUserAlias, getUserAlias } from '../userAlias'

describe(isValidUserAlias.name.toString(), () => {
  it('should return true for valid user_alias objects', () => {
    const alias = {
      alias_label: 'segment-anon-id',
      alias_name: 'anon-123'
    }
    expect(isValidUserAlias(alias)).toBe(true)
  })

  it('should return false for invalid values', () => {
    expect(isValidUserAlias(null)).toBe(false)
    expect(isValidUserAlias(undefined)).toBe(false)
    expect(isValidUserAlias(true)).toBe(false)
    expect(isValidUserAlias(123)).toBe(false)
    expect(isValidUserAlias({})).toBe(false)
    expect(isValidUserAlias({ alias_label: 'hello' })).toBe(false)
    expect(isValidUserAlias({ alias_label: '', alias_name: '' })).toBe(false)
  })
})

describe(getUserAlias.name.toString(), () => {
  it('should return a valid user_alias object when possible', () => {
    const alias = {
      alias_label: 'segment-anon-id',
      alias_name: 'anon-123',
      something_else: 'ignored'
    }
    expect(getUserAlias(alias)).toEqual({
      alias_label: 'segment-anon-id',
      alias_name: 'anon-123'
    })
  })

  it('should return undefined for everything else', () => {
    expect(getUserAlias(null)).toBe(undefined)
    expect(getUserAlias(undefined)).toBe(undefined)
    expect(getUserAlias(true)).toBe(undefined)
    expect(getUserAlias(123)).toBe(undefined)
    expect(getUserAlias({})).toBe(undefined)
    expect(getUserAlias({ alias_label: 'hello' })).toBe(undefined)
    expect(getUserAlias({ alias_label: '', alias_name: '' })).toBe(undefined)
  })
})