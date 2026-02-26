import * as crypto from 'crypto'
import {
  getAudienceId,
  isEngageAudience,
  validate,
  getData,
  normalizeMonth,
  normalizePhone,
  normalizeName,
  normalizeCity,
  normalizeState,
  normalizeZip,
  normalizeCountry
} from '../functions'
import { Payload } from '../generated-types'

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex')

const basePayload: Payload = {
  externalId: 'user-123',
  enable_batching: true,
  batch_size: 1000
}

// ---------------------------------------------------------------------------
// getAudienceId
// ---------------------------------------------------------------------------
describe('getAudienceId', () => {
  it('returns audienceId from hookOutputs when present', () => {
    const hookOutputs = { retlOnMappingSave: { outputs: { audienceId: 'hook-aud-id' } } }
    expect(getAudienceId(basePayload, hookOutputs)).toBe('hook-aud-id')
  })

  it('returns external_audience_id from payload when hookOutputs are absent', () => {
    const payload = { ...basePayload, external_audience_id: 'payload-aud-id' }
    expect(getAudienceId(payload)).toBe('payload-aud-id')
  })

  it('prefers hookOutputs audienceId over payload external_audience_id', () => {
    const payload = { ...basePayload, external_audience_id: 'payload-aud-id' }
    const hookOutputs = { retlOnMappingSave: { outputs: { audienceId: 'hook-aud-id' } } }
    expect(getAudienceId(payload, hookOutputs)).toBe('hook-aud-id')
  })

  it('returns undefined when neither hookOutputs nor payload has an audienceId', () => {
    expect(getAudienceId(basePayload)).toBeUndefined()
  })

  it('returns undefined when hookOutputs exist but audienceId is not set', () => {
    const hookOutputs = { retlOnMappingSave: { outputs: {} } }
    expect(getAudienceId(basePayload, hookOutputs)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// isEngageAudience
// ---------------------------------------------------------------------------
describe('isEngageAudience', () => {
  it('returns true when computation_class is "audience"', () => {
    const payload: Payload = {
      ...basePayload,
      engage_fields: {
        traits_or_properties: { myAudience: true },
        audience_key: 'myAudience',
        computation_class: 'audience'
      }
    }
    expect(isEngageAudience(payload)).toBe(true)
  })

  it('returns true when computation_class is "journey_step"', () => {
    const payload: Payload = {
      ...basePayload,
      engage_fields: {
        traits_or_properties: { myAudience: true },
        audience_key: 'myAudience',
        computation_class: 'journey_step'
      }
    }
    expect(isEngageAudience(payload)).toBe(true)
  })

  it('returns false when engage_fields is absent', () => {
    expect(isEngageAudience(basePayload)).toBe(false)
  })

  it('returns false when computation_class is not "audience" or "journey_step"', () => {
    const payload: Payload = {
      ...basePayload,
      engage_fields: {
        traits_or_properties: { myTrait: 42 },
        audience_key: 'myTrait',
        computation_class: 'computed_trait'
      }
    }
    expect(isEngageAudience(payload)).toBe(false)
  })

  it('returns false when traits_or_properties is not an object', () => {
    const payload = {
      ...basePayload,
      engage_fields: {
        traits_or_properties: null as unknown as object,
        audience_key: 'myAudience',
        computation_class: 'audience'
      }
    } as Payload
    expect(isEngageAudience(payload)).toBe(false)
  })

  it('returns false when audience_key is falsy', () => {
    const payload = {
      ...basePayload,
      engage_fields: {
        traits_or_properties: { myAudience: true },
        audience_key: '' as string,
        computation_class: 'audience'
      }
    } as Payload
    expect(isEngageAudience(payload)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------
describe('validate', () => {
  const engagePayload: Payload = {
    ...basePayload,
    engage_fields: {
      traits_or_properties: { myAudience: true },
      audience_key: 'myAudience',
      computation_class: 'audience'
    }
  }

  it('returns undefined for a valid upsert', () => {
    expect(validate('aud-123', basePayload, 'upsert')).toBeUndefined()
  })

  it('returns undefined for a valid delete', () => {
    expect(validate('aud-123', basePayload, 'delete')).toBeUndefined()
  })

  it('returns undefined for a valid mirror with an Engage payload', () => {
    expect(validate('aud-123', engagePayload, 'mirror')).toBeUndefined()
  })

  it('returns an error message when syncMode is undefined', () => {
    const result = validate('aud-123', basePayload, undefined)
    expect(result).toMatch(/Sync Mode is required/)
  })

  it('returns an error message when syncMode is an unrecognised value', () => {
    const result = validate('aud-123', basePayload, 'replace' as any)
    expect(result).toMatch(/Sync Mode is required/)
  })

  it('returns an error message when audienceId is undefined', () => {
    expect(validate(undefined, basePayload, 'upsert')).toBe('Missing audience ID.')
  })

  it('returns an error message when audienceId is an empty string', () => {
    expect(validate('', basePayload, 'upsert')).toBe('Missing audience ID.')
  })

  it('returns an error message when audienceId is a non-string value', () => {
    expect(validate(99, basePayload, 'upsert')).toBe('Missing audience ID.')
  })

  it('returns an error message when syncMode is "mirror" but payload is not from Engage', () => {
    const result = validate('aud-123', basePayload, 'mirror')
    expect(result).toMatch(/Sync Mode set to "Mirror"/)
  })
})

// ---------------------------------------------------------------------------
// getData
// ---------------------------------------------------------------------------
describe('getData', () => {
  it('passes externalId through without hashing', () => {
    const payload = { ...basePayload, externalId: 'ext-001' }
    const [row] = getData([payload])
    expect(row[0]).toBe('ext-001')
  })

  it('returns empty strings for all hashed fields when only externalId is provided', () => {
    const payload = { ...basePayload, externalId: 'ext-001' }
    const [row] = getData([payload])
    for (let i = 1; i < row.length - 1; i++) {
      expect(row[i]).toBe('')
    }
  })

  it('hashes email as sha256 of the trimmed lowercase value', () => {
    const payload = { ...basePayload, email: '  Test@Example.COM  ' }
    const [row] = getData([payload])
    expect(row[1]).toBe(sha256('test@example.com'))
  })

  it('hashes phone after normalizing (strips non-numeric chars and leading zeros)', () => {
    const payload = { ...basePayload, phone: '+001-800-555-1234' }
    const [row] = getData([payload])
    expect(row[2]).toBe(sha256('18005551234'))
  })

  it('hashes birth year as sha256 of the trimmed value', () => {
    const payload = { ...basePayload, birth: { year: ' 1990 ' } }
    const [row] = getData([payload])
    expect(row[3]).toBe(sha256('1990'))
  })

  it('hashes birth month after normalizing the month name', () => {
    const payload = { ...basePayload, birth: { month: 'january' } }
    const [row] = getData([payload])
    expect(row[4]).toBe(sha256('01'))
  })

  it('hashes birth day as sha256 of the trimmed value', () => {
    const payload = { ...basePayload, birth: { day: ' 05 ' } }
    const [row] = getData([payload])
    expect(row[5]).toBe(sha256('05'))
  })

  it('hashes last name after normalizing (lowercase, no punctuation)', () => {
    const payload = { ...basePayload, name: { last: "O'Brien" } }
    const [row] = getData([payload])
    expect(row[6]).toBe(sha256('obrien'))
  })

  it('hashes first name after normalizing', () => {
    const payload = { ...basePayload, name: { first: 'Anne-Marie' } }
    const [row] = getData([payload])
    expect(row[7]).toBe(sha256('annemarie'))
  })

  it('passes mobileAdId through without hashing', () => {
    const payload = { ...basePayload, mobileAdId: 'AB1234CD-E123-12FG-J123' }
    const [row] = getData([payload])
    expect(row[14]).toBe('AB1234CD-E123-12FG-J123')
  })

  it('returns one row per payload', () => {
    const payloads = [
      { ...basePayload, externalId: 'ext-001' },
      { ...basePayload, externalId: 'ext-002' }
    ]
    const rows = getData(payloads)
    expect(rows).toHaveLength(2)
    expect(rows[0][0]).toBe('ext-001')
    expect(rows[1][0]).toBe('ext-002')
  })
})

// ---------------------------------------------------------------------------
// normalizeMonth
// ---------------------------------------------------------------------------
describe('normalizeMonth', () => {
  it('returns the value unchanged when it is already a 2-digit string', () => {
    expect(normalizeMonth('01')).toBe('01')
    expect(normalizeMonth('06')).toBe('06')
    expect(normalizeMonth('12')).toBe('12')
  })

  it('converts full month names (Jan–Sep) to zero-padded 2-digit numbers', () => {
    expect(normalizeMonth('january')).toBe('01')
    expect(normalizeMonth('february')).toBe('02')
    expect(normalizeMonth('march')).toBe('03')
    expect(normalizeMonth('april')).toBe('04')
    expect(normalizeMonth('may')).toBe('05')
    expect(normalizeMonth('june')).toBe('06')
    expect(normalizeMonth('july')).toBe('07')
    expect(normalizeMonth('august')).toBe('08')
    expect(normalizeMonth('september')).toBe('09')
  })

  it('converts October, November, December to 2-digit numbers without zero-padding', () => {
    expect(normalizeMonth('october')).toBe('10')
    expect(normalizeMonth('november')).toBe('11')
    expect(normalizeMonth('december')).toBe('12')
  })

  it('is case-insensitive for full month names', () => {
    expect(normalizeMonth('January')).toBe('01')
    expect(normalizeMonth('MARCH')).toBe('03')
    expect(normalizeMonth('December')).toBe('12')
  })

  it('returns the original value for unrecognised input', () => {
    expect(normalizeMonth('notamonth')).toBe('notamonth')
  })
})

// ---------------------------------------------------------------------------
// normalizePhone
// ---------------------------------------------------------------------------
describe('normalizePhone', () => {
  it('removes all non-numeric characters', () => {
    expect(normalizePhone('+1 (800) 555-1234')).toBe('18005551234')
  })

  it('removes leading zeros', () => {
    expect(normalizePhone('0044 207 123 4567')).toBe('442071234567')
  })

  it('leaves a plain numeric string unchanged', () => {
    expect(normalizePhone('18005551234')).toBe('18005551234')
  })

  it('removes hyphens and leaves digits only', () => {
    expect(normalizePhone('1-234-567-8910')).toBe('12345678910')
  })
})

// ---------------------------------------------------------------------------
// normalizeName
// ---------------------------------------------------------------------------
describe('normalizeName', () => {
  it('lowercases and trims whitespace', () => {
    expect(normalizeName('  John  ')).toBe('john')
  })

  it("removes apostrophes", () => {
    expect(normalizeName("O'Brien")).toBe('obrien')
  })

  it('removes hyphens', () => {
    expect(normalizeName('Anne-Marie')).toBe('annemarie')
  })

  it('leaves a clean lowercase name unchanged', () => {
    expect(normalizeName('smith')).toBe('smith')
  })
})

// ---------------------------------------------------------------------------
// normalizeCity
// ---------------------------------------------------------------------------
describe('normalizeCity', () => {
  it('lowercases and removes spaces', () => {
    expect(normalizeCity('New York')).toBe('newyork')
  })

  it('trims leading and trailing whitespace', () => {
    expect(normalizeCity('  London  ')).toBe('london')
  })

  it('removes underscores', () => {
    expect(normalizeCity('los_angeles')).toBe('losangeles')
  })
})

// ---------------------------------------------------------------------------
// normalizeState
// ---------------------------------------------------------------------------
describe('normalizeState', () => {
  it('converts a full US state name to the 2-letter code', () => {
    expect(normalizeState('california')).toBe('ca')
    expect(normalizeState('texas')).toBe('tx')
    expect(normalizeState('florida')).toBe('fl')
  })

  it('is case-insensitive when matching full US state names', () => {
    expect(normalizeState('California')).toBe('ca')
    expect(normalizeState('TEXAS')).toBe('tx')
    expect(normalizeState('Illinois')).toBe('il')
  })

  it('matches concatenated multi-word state names', () => {
    expect(normalizeState('newyork')).toBe('ny')
    expect(normalizeState('northcarolina')).toBe('nc')
  })

  it('lowercases and strips non-alpha characters for unrecognised state values', () => {
    expect(normalizeState('Bavaria')).toBe('bavaria')
    expect(normalizeState('British Columbia')).toBe('britishcolumbia')
  })

  it('lowercases an already-abbreviated 2-letter code that is not a map key', () => {
    // 'ca' is a map value, not a key — falls through to the normalisation branch
    expect(normalizeState('CA')).toBe('ca')
  })
})

// ---------------------------------------------------------------------------
// normalizeZip
// ---------------------------------------------------------------------------
describe('normalizeZip', () => {
  it('strips the +4 suffix from a ZIP+4 code', () => {
    expect(normalizeZip('90210-1234')).toBe('90210')
  })

  it('trims whitespace from a plain ZIP code', () => {
    expect(normalizeZip(' 90210 ')).toBe('90210')
  })

  it('strips internal whitespace and lowercases UK-style postal codes', () => {
    expect(normalizeZip('SW1A 1AA')).toBe('sw1a1aa')
  })

  it('returns a plain numeric ZIP unchanged', () => {
    expect(normalizeZip('10001')).toBe('10001')
  })
})

// ---------------------------------------------------------------------------
// normalizeCountry
// ---------------------------------------------------------------------------
describe('normalizeCountry', () => {
  it('lowercases a 2-letter country code', () => {
    expect(normalizeCountry('US')).toBe('us')
    expect(normalizeCountry('GB')).toBe('gb')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeCountry('  US  ')).toBe('us')
  })

  it('removes dots from abbreviated codes', () => {
    expect(normalizeCountry('U.S.')).toBe('us')
  })

  it('removes spaces from multi-word country inputs', () => {
    expect(normalizeCountry('United States')).toBe('unitedstates')
  })
})
