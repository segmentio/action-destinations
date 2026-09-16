import { MultiStatusResponse, ErrorCodes, IntegrationError, RetryableError } from '@segment/actions-core'
import {
  validateAudienceDetails,
  buildContactInfo,
  buildConsent,
  buildJSON,
  buildMember,
  errorTypeForStatus,
  normaliseEmail,
  normalisePhone,
  failAllPayloads,
  getAdvertiserId,
  getAudienceId,
  getAudienceType,
  toList
} from '../functions'
import type { Payload } from '../generated-types'
import type { AudienceSettings } from '../../generated-types'
import type { Consent, HookOutputs } from '../types'
import { processHashing } from '../../../../lib/hashing-utils'
import { AUDIENCE_TYPE_LABEL, RETL_HOOK_LABEL } from '../constants'

const ADVERTISER_ID = '12345'
const AUDIENCE_ID = '98765'
const CONTACT_INFO = 'CUSTOMER_MATCH_CONTACT_INFO'
const DEVICE_ID = 'CUSTOMER_MATCH_DEVICE_ID'
const GRANTED = 'CONSENT_STATUS_GRANTED'
const DENIED = 'CONSENT_STATUS_DENIED'

const hash = (value: string): string =>
  processHashing(value, 'sha256', 'hex', (v) => v.replace(/\s+/g, '').toLowerCase())

describe('validateAudienceDetails', () => {
  it('returns undefined when everything is present and valid', () => {
    expect(validateAudienceDetails(AUDIENCE_ID, ADVERTISER_ID, CONTACT_INFO, CONTACT_INFO)).toBeUndefined()
  })

  it('reports every missing value in one message', () => {
    expect(validateAudienceDetails()).toBe(
      `Missing audience ID. Missing advertiser ID. Missing the audience's type. Set the '${AUDIENCE_TYPE_LABEL}' audience setting, or the '${AUDIENCE_TYPE_LABEL}' field in the '${RETL_HOOK_LABEL}' step when syncing from a warehouse. Missing the '${AUDIENCE_TYPE_LABEL}' mapping field`
    )
  })

  it('combines a missing value with an invalid one', () => {
    expect(validateAudienceDetails(undefined, ADVERTISER_ID, 'SOMETHING_ELSE', 'SOMETHING_ELSE')).toBe(
      `Missing audience ID. Unrecognised audience type: SOMETHING_ELSE. The audience must be ${CONTACT_INFO} or ${DEVICE_ID}`
    )
  })

  // The audience's own type and the mapping field are both labelled Audience Type, so the
  // message names where the value comes from. Asserted in full: it is the only thing keeping
  // this distinguishable from the mapping field message below.
  it('reports a missing audience type, naming the audience setting and the hook step', () => {
    expect(validateAudienceDetails(AUDIENCE_ID, ADVERTISER_ID, undefined, CONTACT_INFO)).toBe(
      `Missing the audience's type. Set the '${AUDIENCE_TYPE_LABEL}' audience setting, or the '${AUDIENCE_TYPE_LABEL}' field in the '${RETL_HOOK_LABEL}' step when syncing from a warehouse`
    )
  })

  // The mapped type is what the customer picked in the mapping. It is required with a default,
  // so an absent one means something is wrong rather than nothing to check.
  it('reports a mapped audience type which is not set', () => {
    expect(validateAudienceDetails(AUDIENCE_ID, ADVERTISER_ID, CONTACT_INFO)).toBe(
      `Missing the '${AUDIENCE_TYPE_LABEL}' mapping field`
    )
  })

  it('reports a mapped audience type that disagrees with the configured one', () => {
    expect(validateAudienceDetails(AUDIENCE_ID, ADVERTISER_ID, DEVICE_ID, CONTACT_INFO)).toBe(
      `The '${AUDIENCE_TYPE_LABEL}' mapping field is set to ${CONTACT_INFO}, but the audience in Display & Video 360 is ${DEVICE_ID}. Set the '${AUDIENCE_TYPE_LABEL}' mapping field to ${DEVICE_ID} so that the mapping shows the identifier fields that audience accepts, or connect this mapping to a ${CONTACT_INFO} audience`
    )
  })
})

const settings = (overrides: Partial<AudienceSettings> = {}): AudienceSettings =>
  ({
    advertiserId: ADVERTISER_ID,
    audienceType: CONTACT_INFO,
    membershipDurationDays: '90',
    ...overrides
  } as AudienceSettings)

const hook = (outputs: Record<string, string>): HookOutputs => ({ retlOnMappingSave: { outputs } })

describe('getAudienceType', () => {
  it('prefers the hook output over the audience settings', () => {
    expect(getAudienceType(settings(), hook({ audienceType: DEVICE_ID }))).toBe(DEVICE_ID)
  })

  it('falls back to the audience settings', () => {
    expect(getAudienceType(settings({ audienceType: DEVICE_ID }))).toBe(DEVICE_ID)
  })

  it('never reads the mapped field, which is only there to be validated against', () => {
    expect(getAudienceType()).toBeUndefined()
  })
})

describe('getAdvertiserId', () => {
  it('prefers the hook output over the audience settings', () => {
    expect(getAdvertiserId(settings(), hook({ advertiserId: 'from-hook' }))).toBe('from-hook')
  })

  it('falls back to the audience settings', () => {
    expect(getAdvertiserId(settings())).toBe(ADVERTISER_ID)
  })

  // There is deliberately no mapped advertiser_id field to fall back to.
  it('resolves to undefined when neither is present', () => {
    expect(getAdvertiserId()).toBeUndefined()
  })
})

describe('getAudienceId', () => {
  const payload = { external_id: AUDIENCE_ID } as Payload

  it('prefers the hook output over the mapped field', () => {
    expect(getAudienceId(payload, hook({ audienceId: 'from-hook' }))).toBe('from-hook')
  })

  // The audience ID is the only one of the three which still falls back to the payload: it is
  // what carries the audience on the Engage path, where no hook runs.
  it('falls back to the mapped external_id', () => {
    expect(getAudienceId(payload)).toBe(AUDIENCE_ID)
  })

  it('resolves to undefined when neither is present', () => {
    expect(getAudienceId({} as Payload)).toBeUndefined()
  })
})

describe('toList', () => {
  it.each([
    ['a@example.com', ['a@example.com']],
    ['a@example.com,b@example.com', ['a@example.com', 'b@example.com']],
    [' a@example.com , b@example.com ', ['a@example.com', 'b@example.com']],
    ['a@example.com,,b@example.com', ['a@example.com', 'b@example.com']],
    [',', []],
    ['   ', []],
    ['', []],
    [undefined, []]
  ])('turns %p into %p', (value, expected) => {
    expect(toList(value as string | undefined)).toEqual(expected)
  })
})

describe('errorTypeForStatus', () => {
  it('reports a 401 as an authentication error so core refreshes the token', () => {
    expect(errorTypeForStatus(401)).toBe('INVALID_AUTHENTICATION')
  })

  it.each([408, 429, 500, 503, 504])('reports %i as retryable', (status: number) => {
    expect(errorTypeForStatus(status)).toBe('RETRYABLE_ERROR')
  })

  // 501 is the case a `status >= 500` check gets wrong: the server does not implement the
  // method, so retrying cannot help.
  it.each([400, 403, 404, 422, 501])('reports %i as a bad request', (status: number) => {
    expect(errorTypeForStatus(status)).toBe('BAD_REQUEST')
  })
})

describe('buildConsent', () => {
  it('passes both signals through', () => {
    expect(buildConsent({ adUserData: GRANTED, adPersonalization: GRANTED })).toEqual({
      consent: { adUserData: GRANTED, adPersonalization: GRANTED }
    })
  })

  it('omits a signal the mapping leaves unset', () => {
    expect(buildConsent({ adUserData: GRANTED })).toEqual({ consent: { adUserData: GRANTED } })
  })

  // An empty consent object is what an unmapped consent field produces. buildJSON leaves the
  // consent key off the request entirely in that case, which DV360 reads as not specified.
  it.each([undefined, {}])('returns an empty consent for %p', (consent?: Payload['consent']) => {
    expect(buildConsent(consent)).toEqual({ consent: {} })
  })

  it.each(['adUserData', 'adPersonalization'])('fails the batch when %s is denied', (field) => {
    const { consent, consentErrorMessage } = buildConsent({ [field]: DENIED })

    expect(consent).toBeUndefined()
    expect(consentErrorMessage).toContain('Consent denied for ad user data or ad personalization')
  })

  it('rejects a consent value that is neither granted nor denied', () => {
    expect(buildConsent({ adUserData: 'MAYBE' }).consentErrorMessage).toBe(
      'Unrecognised consent value: MAYBE. Must be CONSENT_STATUS_GRANTED or CONSENT_STATUS_DENIED.'
    )
  })

  // Denied is checked after the value check, so an unrecognised value is reported even when
  // another signal is denied.
  it('reports an unrecognised value ahead of a denied one', () => {
    expect(buildConsent({ adUserData: 'MAYBE', adPersonalization: DENIED }).consentErrorMessage).toContain(
      'Unrecognised consent value'
    )
  })
})

describe('normaliseEmail', () => {
  it.each([
    ['jane@example.com', 'jane@example.com'],
    // Google matches on a lowercased, trimmed address.
    ['JANE@EXAMPLE.COM', 'jane@example.com'],
    ['  jane@example.com  ', 'jane@example.com'],
    ['jane.doe@example.com', 'jane.doe@example.com'],
    // Plus addressing is a real address and is kept as it is.
    ['jane+promo@example.com', 'jane+promo@example.com'],
    ['jane_doe@example.co.uk', 'jane_doe@example.co.uk'],
    ['jane@sub.domain.example.com', 'jane@sub.domain.example.com'],
    ['jane@example.museum', 'jane@example.museum'],
    ["o'brien@example.com", "o'brien@example.com"],
    ['jané@example.com', 'jané@example.com'],
    ['1@2.co', '1@2.co']
  ])('keeps %p as %p', (value: string, expected: string) => {
    expect(normaliseEmail(value)).toBe(expected)
  })

  it.each([
    ['jane', 'no domain at all'],
    ['jane@', 'nothing after the @'],
    ['@example.com', 'nothing before the @'],
    ['jane@example', 'no dot in the domain'],
    ['jane@.com', 'nothing before the dot'],
    ['jane@example.', 'nothing after the dot'],
    ['jane doe@example.com', 'a space in the local part'],
    ['jane@exa mple.com', 'a space in the domain'],
    ['jane@@example.com', 'two @ signs'],
    ['jane@example.com extra', 'trailing text'],
    ['', 'empty'],
    ['   ', 'only whitespace']
  ])('drops %p, which has %s', (value: string) => {
    expect(normaliseEmail(value)).toBeUndefined()
  })

  // A shape check, not RFC 5322: this one gets through, and Google simply will not match it.
  // Rejecting everything malformed would mean rejecting valid addresses too.
  it('does not claim to catch every malformed address', () => {
    expect(normaliseEmail('jane@example..com')).toBe('jane@example..com')
  })

  // A digest is not email shaped, so validating one would drop every pre hashed value.
  it.each([
    ['a digest', hash('jane@example.com')],
    ['an uppercase digest', hash('jane@example.com').toUpperCase()]
  ])('passes %s through untouched', (_case: string, value: string) => {
    expect(normaliseEmail(value)).toBe(value)
  })
})

describe('normalisePhone', () => {
  // Already international: the country comes from the number, so no region is needed and the
  // punctuation people type is stripped.
  it.each([
    ['+12125650000', '+12125650000'],
    ['+1 (212) 565-0000', '+12125650000'],
    ['+1-212-565-0000', '+12125650000'],
    ['  +1 212 565 0000  ', '+12125650000'],
    ['+44 20 7031 3000', '+442070313000'],
    ['+81 3 1234 5678', '+81312345678'],
    ['+33 1 42 68 53 00', '+33142685300'],
    ['+61 2 9374 4000', '+61293744000'],
    // The extension cannot help a match and is dropped.
    ['+1 212-565-0000 ext. 123', '+12125650000']
  ])('keeps %p as %p without needing a country', (value: string, expected: string) => {
    expect(normalisePhone(value)).toBe(expected)
  })

  it.each([
    ['2125650000', 'US', '+12125650000'],
    ['(212) 565-0000', 'US', '+12125650000'],
    ['212-565-0000', 'US', '+12125650000'],
    ['212.565.0000', 'US', '+12125650000'],
    ['  212 565 0000  ', 'US', '+12125650000'],
    // A national number drops its trunk prefix rather than simply gaining a dialling code.
    ['020 7031 3000', 'GB', '+442070313000'],
    // Dialled internationally from within the given country.
    ['00 44 20 7031 3000', 'GB', '+442070313000'],
    ['011 44 20 7031 3000', 'US', '+442070313000'],
    // Letters are read as the digits they sit on.
    ['1-800-FLOWERS', 'US', '+18003569377']
  ])('reads %p against %p as %p', (value: string, region: string, expected: string) => {
    expect(normalisePhone(value, region)).toBe(expected)
  })

  // A national number and its own country, one per country. Several of these drop a leading
  // digit which is only used for dialling inside that country (IE, DE, NL, RU, TR), while
  // others have no such digit to drop (ES, DK, NO, SE). Every number here is libphonenumber's
  // own example for that country, so these assert the library's view of valid, not ours.
  it.each([
    ['(022) 12345', 'IE', '+3532212345'],
    ['01 23 45 67 89', 'FR', '+33123456789'],
    ['030 123456', 'DE', '+4930123456'],
    ['810 12 34 56', 'ES', '+34810123456'],
    ['02 1234 5678', 'IT', '+390212345678'],
    ['010 123 4567', 'NL', '+31101234567'],
    ['12 345 67 89', 'PL', '+48123456789'],
    ['08-12 34 56', 'SE', '+468123456'],
    ['21 234 5678', 'PT', '+351212345678'],
    ['021 234 56 78', 'CH', '+41212345678'],
    ['012 34 56 78', 'BE', '+3212345678'],
    ['32 12 34 56', 'DK', '+4532123456'],
    ['21 23 45 67', 'NO', '+4721234567'],
    ['013 1234567', 'FI', '+358131234567'],
    ['21 2345 6789', 'GR', '+302123456789'],
    ['074104 10123', 'IN', '+917410410123'],
    ['(11) 2345-6789', 'BR', '+551123456789'],
    ['200 123 4567', 'MX', '+522001234567'],
    ['(021) 8350123', 'ID', '+62218350123'],
    ['01 804 0123', 'NG', '+23418040123'],
    ['010 123 4567', 'ZA', '+27101234567'],
    // Most countries drop a leading 0 when the number is written internationally. Russia drops
    // a leading 8 instead, so the result is +73011234567 and not +783011234567. Sticking a
    // dialling code on the front would produce a different, unmatchable number.
    ['8 (301) 123-45-67', 'RU', '+73011234567'],
    ['(0212) 345 67 89', 'TR', '+902123456789'],
    ['02-212-3456', 'KR', '+8222123456'],
    // Canada shares the +1 calling code with the US, so the country cannot be read from it.
    ['(506) 234-5678', 'CA', '+15062345678']
  ])('reads the national number %p against %p as %p', (value: string, region: string, expected: string) => {
    expect(normalisePhone(value, region)).toBe(expected)
  })

  // The same numbers written in international form, which need no country at all.
  it.each([
    ['+353 22 12345', '+3532212345'],
    ['+49 30 123456', '+4930123456'],
    ['+34 810 12 34 56', '+34810123456'],
    ['+39 02 1234 5678', '+390212345678'],
    ['+48 12 345 67 89', '+48123456789'],
    ['+55 11 2345-6789', '+551123456789'],
    ['+91 74104 10123', '+917410410123'],
    ['+7 301 123-45-67', '+73011234567']
  ])('keeps the international number %p as %p', (value: string, expected: string) => {
    expect(normalisePhone(value)).toBe(expected)
  })

  // A number which is perfectly valid at home but not in the country it is read against.
  it.each([
    ['01 23 45 67 89', 'DE'],
    ['030 123456', 'FR'],
    ['(11) 2345-6789', 'IE'],
    ['074104 10123', 'ZA']
  ])('drops %p when read against %p, where it is not a valid number', (value: string, region: string) => {
    expect(normalisePhone(value, region)).toBeUndefined()
  })

  it.each(['us', ' US ', 'Us'])('accepts %p as a country, whatever the case or spacing', (region: string) => {
    expect(normalisePhone('2125650000', region)).toBe('+12125650000')
  })

  // Ignored rather than guessed at, so the number is dropped instead of being read against the
  // wrong country.
  it.each(['USA', 'UK', 'United States', 'ZZ', '', '  '])('ignores %p as a country', (region: string) => {
    expect(normalisePhone('2125650000', region)).toBeUndefined()
  })

  it('falls back to the second country when the first is not recognised', () => {
    expect(normalisePhone('2125650000', 'USA', 'US')).toBe('+12125650000')
  })

  it('prefers the first country when both are recognised', () => {
    expect(normalisePhone('020 7031 3000', 'GB', 'US')).toBe('+442070313000')
  })

  // Guessing the country would produce a number which silently never matches.
  it('drops a national number when no country is known', () => {
    expect(normalisePhone('2125650000')).toBeUndefined()
  })

  it.each([
    ['555', 'US', 'too short to be a number'],
    ['12345', 'US', 'too short to be a number'],
    ['+15555555555', undefined, 'a 555 area code, which is not real'],
    ['2125650000', 'GB', 'valid in another country but not this one'],
    ['+9991234567', undefined, 'a country calling code which does not exist'],
    ['+1', undefined, 'a country code and nothing else'],
    ['abc', 'US', 'not a number at all'],
    ['', 'US', 'empty'],
    ['   ', 'US', 'only whitespace'],
    ['+++', undefined, 'only punctuation']
  ])('drops %p read against %p, which is %s', (value: string, region: string | undefined, _reason: string) => {
    expect(normalisePhone(value, region)).toBeUndefined()
  })

  it.each([
    ['a digest', hash('+12125650000')],
    ['an uppercase digest', hash('+12125650000').toUpperCase()]
  ])('passes %s through untouched', (_case: string, value: string) => {
    expect(normalisePhone(value)).toBe(value)
  })
})

describe('buildContactInfo', () => {
  const complete = {
    emails: 'Test@Example.com ',
    phoneNumbers: '+12125650000',
    zipCodes: '90210',
    firstName: 'Jane',
    lastName: 'Doe',
    countryCode: 'US'
  }

  it('builds every contact info detail a Contact Info audience accepts', () => {
    expect(buildContactInfo(complete)).toEqual({
      hashedEmails: [hash('test@example.com')],
      hashedPhoneNumbers: [hash('+12125650000')],
      zipCodes: ['90210'],
      hashedFirstName: hash('jane'),
      hashedLastName: hash('doe'),
      // The country code is the one detail Google does not want hashed.
      countryCode: 'US'
    })
  })

  it('hashes every value of a comma separated list', () => {
    expect(
      buildContactInfo({ emails: 'one@example.com, two@example.com', phoneNumbers: '+12125650000, +442070313000' })
    ).toEqual({
      hashedEmails: [hash('one@example.com'), hash('two@example.com')],
      hashedPhoneNumbers: [hash('+12125650000'), hash('+442070313000')]
    })
  })

  // Google rejects a partial address, so the four address details are all or nothing.
  it.each(['zipCodes', 'firstName', 'lastName', 'countryCode'] as const)(
    'drops the address group without %s',
    (field) => {
      const { [field]: _missing, ...partial } = complete

      expect(buildContactInfo(partial)).toEqual({
        hashedEmails: [hash('test@example.com')],
        hashedPhoneNumbers: [hash('+12125650000')]
      })
    }
  )

  it('keeps the address group when it is complete but there is no email or phone', () => {
    const { emails: _emails, phoneNumbers: _phoneNumbers, ...address } = complete

    expect(buildContactInfo(address)).toEqual({
      zipCodes: ['90210'],
      hashedFirstName: hash('jane'),
      hashedLastName: hash('doe'),
      countryCode: 'US'
    })
  })

  // The user is still synced on whatever survives validation.
  it('drops the invalid identifiers and keeps the valid ones', () => {
    expect(
      buildContactInfo({
        emails: 'jane@example.com, not-an-email, jane@',
        phoneNumbers: '+12125650000, notaphone, 2125650000'
      })
    ).toEqual({
      hashedEmails: [hash('jane@example.com')],
      hashedPhoneNumbers: [hash('+12125650000')]
    })
  })

  it('uses the default country for a number which carries none', () => {
    expect(buildContactInfo({ phoneNumbers: '(212) 565-0000' }, { defaultCountryCode: 'US' })).toEqual({
      hashedPhoneNumbers: [hash('+12125650000')]
    })
  })

  const britishUser = {
    phoneNumbers: '02070313000',
    zipCodes: 'SW1A 1AA',
    firstName: 'Jane',
    lastName: 'Doe',
    countryCode: 'GB'
  }

  const address = {
    zipCodes: ['SW1A 1AA'],
    hashedFirstName: hash('jane'),
    hashedLastName: hash('doe'),
    countryCode: 'GB'
  }

  // Opted in, the user's own country code is preferred over the default.
  it("prefers the user's country code when the mapping opts in", () => {
    expect(buildContactInfo(britishUser, { defaultCountryCode: 'US', useContactInfoCountryCode: true })).toEqual({
      hashedPhoneNumbers: [hash('+442070313000')],
      ...address
    })
  })

  // Off by default, so the country code is only sent in the address group and never used to
  // read a phone number. Here the default country cannot make sense of a British number.
  it("ignores the user's country code unless the mapping opts in", () => {
    expect(buildContactInfo(britishUser, { defaultCountryCode: 'US' })).toEqual(address)
  })

  it("ignores the user's country code when no phone settings are mapped at all", () => {
    expect(buildContactInfo(britishUser)).toEqual(address)
  })

  // Nothing survives validation, so the event has no usable identifier and buildMember fails it.
  it('returns undefined when every identifier is invalid', () => {
    expect(buildContactInfo({ emails: 'not-an-email', phoneNumbers: 'notaphone' })).toBeUndefined()
  })

  // The country code is the one address detail sent unhashed, so it is tidied on the way out
  // rather than relying on the mapping to be clean.
  it('trims and uppercases the country code it sends', () => {
    expect(buildContactInfo({ zipCodes: '90210', firstName: 'Jane', lastName: 'Doe', countryCode: ' us ' })).toEqual({
      zipCodes: ['90210'],
      hashedFirstName: hash('jane'),
      hashedLastName: hash('doe'),
      countryCode: 'US'
    })
  })

  // The hash helper in this file mirrors the implementation, so these anchor the digests
  // against SHA-256 of the normalised value. Without them a change to how values are
  // normalised before hashing would move both sides at once and go unnoticed.
  it('hashes each identifier as SHA-256 of its normalised value', () => {
    expect(
      buildContactInfo({
        emails: ' Test@Example.COM ',
        phoneNumbers: '+1 (212) 565-0000',
        zipCodes: '90210',
        firstName: ' Jane ',
        lastName: 'DOE',
        countryCode: 'US'
      })
    ).toEqual({
      hashedEmails: ['973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'],
      hashedPhoneNumbers: ['d360a79e746532a6a1e7b8164440b04cdd8797e23126f7a4de7a4b67fdcdba98'],
      zipCodes: ['90210'],
      hashedFirstName: '81f8f6dde88365f3928796ec7aa53f72820b06db8664f5fe76a7eb13e24546a2',
      hashedLastName: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
      countryCode: 'US'
    })
  })

  // Every hashed field accepts a value which the customer has already hashed. Hashing one a
  // second time would produce a digest of a digest, which can never match.
  it('does not hash any identifier which is already hashed', () => {
    expect(
      buildContactInfo({
        emails: hash('test@example.com'),
        phoneNumbers: hash('+12125650000'),
        zipCodes: '90210',
        firstName: hash('jane'),
        lastName: hash('doe'),
        countryCode: 'US'
      })
    ).toEqual({
      hashedEmails: [hash('test@example.com')],
      hashedPhoneNumbers: [hash('+12125650000')],
      zipCodes: ['90210'],
      hashedFirstName: hash('jane'),
      hashedLastName: hash('doe'),
      countryCode: 'US'
    })
  })

  it('does not hash a value which is already hashed, and lowercases the digest', () => {
    expect(buildContactInfo({ emails: hash('test@example.com').toUpperCase() })).toEqual({
      hashedEmails: [hash('test@example.com')]
    })
  })

  // A list can hold both, so the decision is made per value rather than per field.
  it('hashes the plain values of a list and leaves the hashed ones alone', () => {
    expect(
      buildContactInfo({
        emails: `one@example.com, ${hash('two@example.com')}`,
        phoneNumbers: `+12125650000, ${hash('+442070313000')}`
      })
    ).toEqual({
      hashedEmails: [hash('one@example.com'), hash('two@example.com')],
      hashedPhoneNumbers: [hash('+12125650000'), hash('+442070313000')]
    })
  })

  it.each([undefined, {}, { emails: '' }, { zipCodes: '90210' }])(
    'returns undefined when %p yields no usable identifier',
    (mappedContactInfo?: Payload['contact_info']) => {
      expect(buildContactInfo(mappedContactInfo)).toBeUndefined()
    }
  )
})

describe('buildMember', () => {
  const target = { audienceId: AUDIENCE_ID, advertiserId: ADVERTISER_ID, audienceType: CONTACT_INFO }
  const payload = {
    contact_info: { emails: 'a@example.com' },
    external_id: AUDIENCE_ID
  } as Payload

  it('returns the member for a valid payload', () => {
    expect(buildMember(payload, true, target)).toEqual({ members: [{ hashedEmails: [hash('a@example.com')] }] })
  })

  it('returns a member carrying every contact info detail', () => {
    const complete = {
      ...payload,
      contact_info: {
        emails: 'jane@example.com',
        phoneNumbers: '+12125650000',
        zipCodes: '90210',
        firstName: 'Jane',
        lastName: 'Doe',
        countryCode: 'US'
      }
    } as Payload

    expect(buildMember(complete, true, target)).toEqual({
      members: [
        {
          hashedEmails: [hash('jane@example.com')],
          hashedPhoneNumbers: [hash('+12125650000')],
          zipCodes: ['90210'],
          hashedFirstName: hash('jane'),
          hashedLastName: hash('doe'),
          countryCode: 'US'
        }
      ]
    })
  })

  it('splits a comma separated list of mobile device IDs into one member each', () => {
    expect(
      buildMember({ ...payload, mobileDeviceIds: 'device-1, device-2' }, true, {
        ...target,
        audienceType: 'CUSTOMER_MATCH_DEVICE_ID'
      })
    ).toEqual({ members: ['device-1', 'device-2'] })
  })

  it('rejects an unresolved membership', () => {
    expect(buildMember(payload, undefined, target)).toEqual({
      errortype: 'INVALID_AUDIENCE_MEMBERSHIP',
      errormessage: 'Audience membership could not be resolved to a boolean'
    })
  })

  it('rejects an event for a different audience', () => {
    const result = buildMember({ ...payload, external_id: 'another-audience' }, true, target)
    expect(result.errormessage).toContain('does not belong to the same audience')
  })

  it('rejects an event with no usable identifier', () => {
    const result = buildMember({ external_id: AUDIENCE_ID } as Payload, true, target)
    expect(result.errormessage).toContain('No usable contact info identifiers')
  })

  it('rejects a device ID audience event with no device ID', () => {
    const result = buildMember(payload, true, { ...target, audienceType: DEVICE_ID })
    expect(result.errormessage).toContain('No mobile device ID')
  })
})

describe('buildJSON', () => {
  const jane = { hashedEmails: ['jane'] }
  const john = { hashedEmails: ['john'] }
  const consent = { adUserData: GRANTED, adPersonalization: GRANTED } as const

  it('puts adds and removes in one contact info request', () => {
    expect(buildJSON(ADVERTISER_ID, CONTACT_INFO, [jane], [john], consent)).toEqual({
      advertiserId: ADVERTISER_ID,
      addedContactInfoList: { contactInfos: [jane], consent },
      removedContactInfoList: { contactInfos: [john], consent }
    })
  })

  it('omits the list which has no members', () => {
    expect(buildJSON(ADVERTISER_ID, CONTACT_INFO, [], [john], consent)).toEqual({
      advertiserId: ADVERTISER_ID,
      removedContactInfoList: { contactInfos: [john], consent }
    })
  })

  it('builds the mobile device ID lists for a device ID audience', () => {
    expect(buildJSON(ADVERTISER_ID, DEVICE_ID, ['device-1'], ['device-2'], consent)).toEqual({
      advertiserId: ADVERTISER_ID,
      addedMobileDeviceIdList: { mobileDeviceIds: ['device-1'], consent },
      removedMobileDeviceIdList: { mobileDeviceIds: ['device-2'], consent }
    })
  })

  // An empty consent is what an unmapped consent field produces. Leaving the key off is how
  // Display & Video 360 is told the signals are not specified.
  it.each([{}, undefined])('leaves the consent key off the request for %p', (empty?: Consent) => {
    expect(buildJSON(ADVERTISER_ID, CONTACT_INFO, [jane], [], empty)).toEqual({
      advertiserId: ADVERTISER_ID,
      addedContactInfoList: { contactInfos: [jane] }
    })
  })
})

// failAllPayloads is the only caller of the private setError, so these cover both.
describe('failAllPayloads', () => {
  const payloads = [{}, {}] as Payload[]

  it('sets an error at every index of a batch, with no sent payload', () => {
    const msResponse = failAllPayloads(new MultiStatusResponse(), payloads, true, 'Nothing was sent')

    expect(msResponse.getAllResponses().map((response) => response.value())).toEqual([
      { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Nothing was sent' },
      { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Nothing was sent' }
    ])
  })

  // A single event has no MultiStatusResponse to report into, so it throws instead.
  it('throws an IntegrationError for a single event', () => {
    expect(() => failAllPayloads(new MultiStatusResponse(), payloads, false, 'Nothing was sent')).toThrow(
      IntegrationError
    )
  })

  it('throws a RetryableError for a single event on a transient status', () => {
    expect(() =>
      failAllPayloads(new MultiStatusResponse(), payloads, false, 'Try again', ErrorCodes.RETRYABLE_ERROR, 503)
    ).toThrow(RetryableError)
  })

  it('throws an InvalidAudienceMembershipError for a single event with unresolved membership', () => {
    expect(() =>
      failAllPayloads(
        new MultiStatusResponse(),
        payloads,
        false,
        'No membership',
        ErrorCodes.INVALID_AUDIENCE_MEMBERSHIP
      )
    ).toThrow('No membership')
  })
})
