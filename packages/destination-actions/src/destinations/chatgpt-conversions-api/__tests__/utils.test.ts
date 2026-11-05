import crypto from 'crypto'
import {
  clean,
  cleanEmail,
  cleanExternalId,
  cleanName,
  cleanPhone,
  hashValue,
  hashValues,
  toCountry,
  toCustomEventName,
  toGaid,
  toCurrency,
  toIpAddress,
  toMinorUnitExponent,
  toMinorUnits,
  toMoney,
  toSourceUrl,
  toTimestampMs,
  toVariants
} from '../sendConversion/utils'
import { ISO_COUNTRY_CODES } from '../constants'

const NOW = Date.parse('2026-11-03T12:00:00.000Z')
const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex')

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW)
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('hashValue', () => {
  it('hashes a value after trimming and cleaning', () => {
    expect(hashValue('  Jane@Example.COM ', (value) => value.toLowerCase())).toBe(sha256('jane@example.com'))
  })

  it('does not hash a value that is already a SHA-256 hex digest', () => {
    const hashed = sha256('jane@example.com')
    expect(hashValue(hashed, (value) => value.toLowerCase())).toBe(hashed)
  })

  it('lowercases an uppercase pre-hashed value', () => {
    const hashed = sha256('jane@example.com')
    expect(hashValue(hashed.toUpperCase(), (value) => value)).toBe(hashed)
  })

  it('returns undefined for blank values and for values that clean to empty', () => {
    expect(hashValue('   ', (value) => value)).toBeUndefined()
    expect(hashValue(undefined, (value) => value)).toBeUndefined()
    expect(hashValue('---', cleanName)).toBeUndefined()
  })
})

describe('cleaners', () => {
  it('cleans phone numbers per the ChatGPT Conversions API rules', () => {
    expect(cleanPhone('+1 (415) 555-0100')).toBe('14155550100')
    expect(cleanPhone('0044 20.7946.0958')).toBe('442079460958')
    expect(cleanPhone('12345')).toBe('')
    expect(cleanPhone('not a phone')).toBe('')
  })

  it('removes whitespace and ASCII punctuation from names but keeps non-ASCII characters', () => {
    expect(cleanName("  Jean-Luc O'Brien ")).toBe('jeanlucobrien')
    expect(cleanName('Zoë')).toBe('zoë')
  })
})

describe('toMinorUnits', () => {
  it.each([
    [100.05, 'USD', 10005],
    [19.99, 'USD', 1999],
    [1.005, 'USD', 101],
    [42, 'USD', 4200],
    [1000, 'JPY', 1000],
    [1.234, 'KWD', 1234],
    [0, 'USD', 0]
  ] as [number, string, number][])('converts %p %s to %p minor units', (amount, currency, expected) => {
    expect(toMinorUnits(amount, currency)).toBe(expected)
  })

  it('allows negative amounts such as refunds and rejects invalid currencies', () => {
    expect(toMinorUnits(-1.5, 'USD')).toBe(-150)
    expect(() => toMinorUnits(1, 'ZZZZ')).toThrow('not a valid ISO 4217')
  })
})

describe('toTimestampMs', () => {
  it('accepts a recent timestamp', () => {
    expect(toTimestampMs('2026-11-03T11:00:00.000Z')).toBe(Date.parse('2026-11-03T11:00:00.000Z'))
  })

  it('rejects timestamps older than 7 days, too far in the future, or invalid', () => {
    expect(() => toTimestampMs('2026-10-26T11:59:00.000Z')).toThrow('more than 7 days old')
    expect(() => toTimestampMs('2026-11-03T12:11:00.000Z')).toThrow('more than 10 minutes in the future')
    expect(() => toTimestampMs('nope')).toThrow('not a valid date')
  })
})

describe('toCustomEventName', () => {
  it('trims and lowercases a valid name', () => {
    expect(toCustomEventName('  Webinar_Replay-1 ')).toBe('webinar_replay-1')
  })

  it.each(['', '   ', 'has space', '-leading', 'trailing-', 'order_created'])('rejects %p', (value) => {
    expect(() => toCustomEventName(value)).toThrow()
  })

  it('accepts a 64 character name and rejects a 65 character name', () => {
    expect(toCustomEventName('a'.repeat(64))).toBe('a'.repeat(64))
    expect(() => toCustomEventName('a'.repeat(65))).toThrow('at most 64 characters')
  })
})

describe('toSourceUrl', () => {
  it('returns a trimmed http(s) URL', () => {
    expect(toSourceUrl('  https://example.com/a ', true)).toBe('https://example.com/a')
  })

  it('throws when required and missing or invalid, and drops invalid values when optional', () => {
    expect(() => toSourceUrl(undefined, true)).toThrow('required')
    expect(() => toSourceUrl('example.com', true)).toThrow('valid URL')
    expect(toSourceUrl('example.com', false)).toBeUndefined()
    expect(toSourceUrl(undefined, false)).toBeUndefined()
  })
})

describe('toCountry', () => {
  it('has the 249 ISO 3166-1 alpha-2 codes with no duplicates', () => {
    expect(ISO_COUNTRY_CODES).toHaveLength(249)
    expect(new Set(ISO_COUNTRY_CODES).size).toBe(249)
  })

  it('uppercases a valid code and rejects an unknown one', () => {
    expect(toCountry(' ie ')).toBe('IE')
    expect(toCountry('  ')).toBeUndefined()
    expect(() => toCountry('ZZ')).toThrow('not a valid ISO 3166-1')
    expect(() => toCountry('UK')).toThrow('not a valid ISO 3166-1')
  })
})

describe('toIpAddress and toGaid', () => {
  it('accepts IPv4 and IPv6 and rejects anything else', () => {
    expect(toIpAddress(' 203.0.113.9 ')).toBe('203.0.113.9')
    expect(toIpAddress('2001:db8::1')).toBe('2001:db8::1')
    expect(() => toIpAddress('not-an-ip')).toThrow('not a valid IPv4 or IPv6')
  })

  it('lowercases a valid GAID and ignores all-zero or malformed ones', () => {
    expect(toGaid('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE')).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    expect(toGaid('00000000-0000-0000-0000-000000000000')).toBeUndefined()
    expect(toGaid('not-a-gaid')).toBeUndefined()
  })
})

describe('toVariants', () => {
  it('stringifies numbers and booleans, trims, and skips blanks and non-primitive values', () => {
    expect(
      toVariants({ ' size ': ' M ', count: 3, active: true, blank: '  ', nested: { a: 1 }, nothing: null })
    ).toEqual({
      size: 'M',
      count: '3',
      active: 'true'
    })
    expect(toVariants({ blank: ' ' })).toBeUndefined()
    expect(toVariants(undefined)).toBeUndefined()
  })
})

describe('clean', () => {
  it('trims strings and returns undefined for blanks and non-strings', () => {
    expect(clean('  abc ')).toBe('abc')
    expect(clean('   ')).toBeUndefined()
    expect(clean('')).toBeUndefined()
    expect(clean(undefined)).toBeUndefined()
    expect(clean(null)).toBeUndefined()
    expect(clean(123)).toBeUndefined()
    expect(clean({})).toBeUndefined()
  })
})

describe('cleanEmail and cleanExternalId', () => {
  it('trims and lowercases emails', () => {
    expect(cleanEmail('  Jane@Example.COM ')).toBe('jane@example.com')
  })

  it('trims external IDs without changing case', () => {
    expect(cleanExternalId('  User_ABC ')).toBe('User_ABC')
  })
})

describe('hashValues', () => {
  const lower = (value: string) => value.toLowerCase()

  it('hashes each value in a list', () => {
    expect(hashValues(['A@x.com', 'b@x.com'], lower)).toEqual([sha256('a@x.com'), sha256('b@x.com')])
  })

  it('accepts a single value instead of a list', () => {
    expect(hashValues('A@x.com', lower)).toEqual([sha256('a@x.com')])
  })

  it('drops blank, undefined and non-string entries', () => {
    expect(hashValues([undefined, '  ', 'a@x.com', null, 5], lower)).toEqual([sha256('a@x.com')])
  })

  it('drops entries that clean to empty', () => {
    expect(hashValues(['12345', '+14155550100'], cleanPhone)).toEqual([sha256('14155550100')])
  })

  it('keeps already hashed values without hashing them again', () => {
    const hashed = sha256('a@x.com')
    expect(hashValues([hashed], lower)).toEqual([hashed])
  })

  it('keeps at most 3 values', () => {
    expect(hashValues(['a', 'b', 'c', 'd', 'e'], lower)).toEqual([sha256('a'), sha256('b'), sha256('c')])
  })

  it('returns an empty list for undefined or an empty list', () => {
    expect(hashValues(undefined, lower)).toEqual([])
    expect(hashValues([], lower)).toEqual([])
  })
})

describe('toMinorUnitExponent', () => {
  it.each([
    ['USD', 2],
    ['usd', 2],
    ['JPY', 0],
    ['KWD', 3],
    ['XCG', 2],
    ['XAU', 2]
  ] as [string, number][])('returns the minor unit exponent for %s', (currency, expected) => {
    expect(toMinorUnitExponent(currency)).toBe(expected)
  })

  it.each(['ZZZZ', 'US', '', '12'])('rejects the malformed currency code %p', (currency) => {
    expect(() => toMinorUnitExponent(currency)).toThrow('not a valid ISO 4217')
  })

  describe('caching', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    const loadFreshToMinorUnitExponent = async (): Promise<typeof toMinorUnitExponent> => {
      jest.resetModules()
      const fresh = await import('../sendConversion/utils')
      return fresh.toMinorUnitExponent
    }

    it('builds the formatter once per currency, ignoring case', async () => {
      const fresh = await loadFreshToMinorUnitExponent()
      const spy = jest.spyOn(Intl, 'NumberFormat')

      expect(fresh('JPY')).toBe(0)
      expect(fresh('jpy')).toBe(0)
      expect(fresh('JPY')).toBe(0)

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('builds a separate formatter for each distinct currency', async () => {
      const fresh = await loadFreshToMinorUnitExponent()
      const spy = jest.spyOn(Intl, 'NumberFormat')

      expect(fresh('USD')).toBe(2)
      expect(fresh('KWD')).toBe(3)
      expect(fresh('USD')).toBe(2)
      expect(fresh('KWD')).toBe(3)

      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('does not cache or build a formatter for a rejected currency', async () => {
      const fresh = await loadFreshToMinorUnitExponent()
      const spy = jest.spyOn(Intl, 'NumberFormat')

      expect(() => fresh('XYZ')).toThrow('not a valid ISO 4217')
      expect(() => fresh('XYZ')).toThrow('not a valid ISO 4217')

      expect(spy).not.toHaveBeenCalled()
    })
  })

  it.each(['XYZ', 'ANG', 'BGN', 'HRK', 'BTC', 'USDT'])(
    'rejects the well-formed code %p that ChatGPT Conversions API does not accept',
    (currency: string) => {
      expect(() => toMinorUnitExponent(currency)).toThrow('not a valid ISO 4217')
    }
  )
})

describe('toCurrency', () => {
  it('trims and uppercases a valid currency code', () => {
    expect(toCurrency(' usd ')).toBe('USD')
    expect(toCurrency('JPY')).toBe('JPY')
  })

  it('returns undefined for blank and non-string values', () => {
    expect(toCurrency(undefined)).toBeUndefined()
    expect(toCurrency('   ')).toBeUndefined()
    expect(toCurrency(840)).toBeUndefined()
  })

  it('rejects malformed currency codes', () => {
    expect(() => toCurrency('US')).toThrow('not a valid ISO 4217')
    expect(() => toCurrency('ZZZZ')).toThrow('not a valid ISO 4217')
  })

  it('rejects a well-formed code that is not an accepted ISO 4217 currency', () => {
    expect(() => toCurrency('XYZ')).toThrow('Currency "XYZ" is not a valid ISO 4217')
    expect(() => toCurrency(' xyz ')).toThrow('not a valid ISO 4217')
  })
})

describe('toMoney', () => {
  it('returns an empty object when there is no amount, even with a currency', () => {
    expect(toMoney(undefined, 'USD', 'currency needed')).toEqual({})
    expect(toMoney(undefined, undefined, 'currency needed')).toEqual({})
  })

  it('converts the amount to minor units and keeps the currency', () => {
    expect(toMoney(100.05, 'USD', 'currency needed')).toEqual({ amount: 10005, currency: 'USD' })
    expect(toMoney(1000, 'JPY', 'currency needed')).toEqual({ amount: 1000, currency: 'JPY' })
  })

  it('throws the supplied message when there is an amount but no currency', () => {
    expect(() => toMoney(10, undefined, 'currency needed')).toThrow('currency needed')
  })

  it('allows negative amounts', () => {
    expect(toMoney(-1, 'USD', 'currency needed')).toEqual({ amount: -100, currency: 'USD' })
  })
})
