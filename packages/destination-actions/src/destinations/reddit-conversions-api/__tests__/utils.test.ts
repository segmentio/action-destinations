import { PayloadValidationError } from '@segment/actions-core'
import { base64Sha256ToHex, getDataProcessingOptions, getMetadata, getUser } from '../utils'

describe('getMetadata', () => {
  it('drops currency/value_decimal/item_count for tracking types that don\'t support any event metadata', () => {
    const result = getMetadata({ currency: 'USD', item_count: 5, value_decimal: 10 }, undefined, undefined, 'Search')
    expect(result?.currency).toBeUndefined()
    expect(result?.item_count).toBeUndefined()
    expect(result?.value_decimal).toBeUndefined()
  })

  it('drops item_count but keeps currency/value_decimal for Lead/SignUp', () => {
    const result = getMetadata({ currency: 'USD', item_count: 5, value_decimal: 10 }, undefined, undefined, 'Lead')
    expect(result?.currency).toBe('USD')
    expect(result?.value_decimal).toBe(10)
    expect(result?.item_count).toBeUndefined()
  })
})

describe('getDataProcessingOptions', () => {
  it('returns undefined when the field is absent', () => {
    expect(getDataProcessingOptions(undefined)).toBeUndefined()
  })

  it('returns undefined for an empty object, so no empty data_processing_options is sent', () => {
    expect(getDataProcessingOptions({})).toBeUndefined()
  })

  it('omits the keys that did not resolve', () => {
    expect(getDataProcessingOptions({ country: 'US', region: 'CA' })).toEqual({ country: 'US', region: 'CA' })
  })

  it('splits modes into an array', () => {
    expect(getDataProcessingOptions({ country: 'US', modes: 'LDU', region: 'CA' })).toEqual({
      country: 'US',
      modes: ['LDU'],
      region: 'CA'
    })
  })
})

const ALICE_HEX = 'ff8d9819fc0e12bf0d24892e45987e249a28dce836a85cad60e28eaaa8c6d976'
const ALICE_BASE64 = '/42YGfwOEr8NJIkuRZh+JJoo3Og2qFytYOKOqqjG2XY='
const PHONE_HEX = 'e5b124c58580eb16bd959b8d0cac12b12c952e2ceae0203d416cff94f10b994a'
const PHONE_BASE64 = '5bEkxYWA6xa9lZuNDKwSsSyVLizq4CA9QWz/lPELmUo='
const EXTERNAL_ID_HEX = 'a4cc2fc5adf58a029291c1514d273989113a1d05e1d753c1d0c3a848af7109cc'
const EXTERNAL_ID_BASE64 = 'pMwvxa31igKSkcFRTSc5iRE6HQXh11PB0MOoSK9xCcw='
const EXTERNAL_ID_BASE64_HASHED_AS_RAW = '7b275682fe68513801d48382a082010482e1f0dd68811cc2e4b03dad0d6b6624'
const IDFA_HEX = '70574fa9c8f498a7b2e5c8712b1126de7b1406fd02fdc591821c5bd33092fd1c'
const IDFA_BASE64 = 'cFdPqcj0mKey5chxKxEm3nsUBv0C/cWRghxb0zCS/Rw='
const AAID_HEX = 'f23b554b2a8fb732a8b973733832e70f018da7bc294dfea289735a07d5dd2c9f'
const AAID_BASE64 = '8jtVSyqPtzKouXNzODLnDwGNp7wpTf6iiXNaB9XdLJ8='
const IP_HEX = '440a628a0c975ea32d4db42ca94acebc975ab378b3ee2a692ccf2ecae6038bbd'
const IP_BASE64 = 'RApiigyXXqMtTbQsqUrOvJdas3iz7ippLM8uyuYDi70='

describe('base64Sha256ToHex', () => {
  it('converts a Base64 SHA-256 to lowercase hex', () => {
    expect(base64Sha256ToHex(ALICE_BASE64)).toBe(ALICE_HEX)
  })

  it('returns undefined for hex, raw values and wrong-length Base64', () => {
    expect(base64Sha256ToHex(ALICE_HEX)).toBeUndefined()
    expect(base64Sha256ToHex('customer12345')).toBeUndefined()
    expect(base64Sha256ToHex('alice@example.com')).toBeUndefined()
    expect(base64Sha256ToHex(ALICE_BASE64.slice(0, -1))).toBeUndefined()
  })

  it('returns undefined for a 44 character value that is not a canonical 32 byte encoding', () => {
    expect(base64Sha256ToHex(ALICE_BASE64.replace('XY=', 'XZ='))).toBeUndefined()
  })
})

describe('getUser hashing', () => {
  it('converts Base64 SHA-256 values to the expected hex for every identifier except external_id', () => {
    const user = getUser(
      {
        email: ALICE_BASE64,
        phone_number: PHONE_BASE64,
        ip_address: IP_BASE64,
        device_type: 'ios',
        advertising_id: IDFA_BASE64
      },
      undefined,
      undefined
    )
    expect(user).toMatchObject({
      email: ALICE_HEX,
      phone_number: PHONE_HEX,
      ip_address: IP_HEX,
      idfa: IDFA_HEX
    })
  })

  it('hashes a Base64 looking external_id as a raw value instead of treating it as a hash', () => {
    const user = getUser({ external_id: EXTERNAL_ID_BASE64 }, undefined, undefined)
    expect(user?.external_id).toBe(EXTERNAL_ID_BASE64_HASHED_AS_RAW)
  })

  it('converts a Base64 Android advertising ID to the expected aaid hex', () => {
    const user = getUser({ device_type: 'android', advertising_id: AAID_BASE64 }, undefined, undefined)
    expect(user?.aaid).toBe(AAID_HEX)
  })

  it('judges each identifier on its own, mixing Base64, hex and raw values', () => {
    const user = getUser(
      { email: ALICE_BASE64, phone_number: PHONE_HEX, external_id: 'customer12345' },
      undefined,
      undefined
    )
    expect(user).toMatchObject({ email: ALICE_HEX, phone_number: PHONE_HEX, external_id: EXTERNAL_ID_HEX })
  })

  it('trims whitespace around Base64 and hex values before checking them', () => {
    const user = getUser({ email: ` ${ALICE_BASE64}\n`, phone_number: ` ${PHONE_HEX} ` }, undefined, undefined)
    expect(user).toMatchObject({ email: ALICE_HEX, phone_number: PHONE_HEX })
  })

  it('lowercases uppercase hex for email, phone_number and advertising ID only', () => {
    const user = getUser(
      {
        email: ALICE_HEX.toUpperCase(),
        phone_number: PHONE_HEX.toUpperCase(),
        device_type: 'ios',
        advertising_id: IDFA_HEX.toUpperCase(),
        external_id: EXTERNAL_ID_HEX.toUpperCase(),
        ip_address: IP_HEX.toUpperCase()
      },
      undefined,
      undefined
    )
    expect(user).toMatchObject({
      email: ALICE_HEX,
      phone_number: PHONE_HEX,
      idfa: IDFA_HEX,
      external_id: EXTERNAL_ID_HEX.toUpperCase(),
      ip_address: IP_HEX.toUpperCase()
    })
  })

  it('still canonicalizes and hashes raw values', () => {
    const user = getUser(
      { email: 'Al.ice+Apple@Example.Com', phone_number: '+1 (555) 444-1234', external_id: 'customer12345' },
      undefined,
      undefined
    )
    expect(user).toMatchObject({ email: ALICE_HEX, phone_number: PHONE_HEX, external_id: EXTERNAL_ID_HEX })
  })

  it('drops empty and whitespace-only identifiers instead of sending an empty string', () => {
    const user = getUser(
      { email: '', phone_number: '   ', external_id: '\n', ip_address: '', device_type: 'ios', advertising_id: ' ' },
      undefined,
      undefined
    )
    expect(user?.email).toBeUndefined()
    expect(user?.phone_number).toBeUndefined()
    expect(user?.external_id).toBeUndefined()
    expect(user?.ip_address).toBeUndefined()
    expect(user?.idfa).toBeUndefined()
  })

  it('throws a PayloadValidationError for an email that is neither a valid address nor a recognised hash', () => {
    const run = () => getUser({ email: ALICE_BASE64.slice(0, -1) }, undefined, undefined)
    expect(run).toThrow(PayloadValidationError)
    expect(run).toThrow('Email must be a valid email address or a SHA-256 hash')
  })
})
