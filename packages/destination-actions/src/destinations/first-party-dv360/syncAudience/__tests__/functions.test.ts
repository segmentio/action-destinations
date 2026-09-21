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
import type { Consent, HookOutputs, PhoneOptions } from '../types'
import { processHashing } from '../../../../lib/hashing-utils'
import {
  AUDIENCE_TYPE_LABEL,
  RETL_HOOK_LABEL,
  PHONE_NORMALIZATION_NONE,
  PHONE_NORMALIZATION_NORMALIZE,
  PHONE_NORMALIZATION_VALIDATE,
  COUNTRIES,
  COUNTRY_CHOICES,
  PHONE_REGION_CHOICES
} from '../constants'

const ADVERTISER_ID = '12345'
const AUDIENCE_ID = '98765'
const CONTACT_INFO = 'CUSTOMER_MATCH_CONTACT_INFO'
const DEVICE_ID = 'CUSTOMER_MATCH_DEVICE_ID'
const GRANTED = 'CONSENT_STATUS_GRANTED'
const DENIED = 'CONSENT_STATUS_DENIED'

const hash = (value: string): string =>
  processHashing(value, 'sha256', 'hex', (v) => v.replace(/\s+/g, '').toLowerCase())

const hashName = (value: string): string => processHashing(value, 'sha256', 'hex', (v) => v.trim().toLowerCase())

const hashPhone = (value: string): string => processHashing(value, 'sha256', 'hex', (v) => v.trim())

describe('validateAudienceDetails', () => {
  it('returns undefined when everything is present and valid', () => {
    expect(validateAudienceDetails(AUDIENCE_ID, ADVERTISER_ID, CONTACT_INFO)).toBeUndefined()
  })

  it('reports every missing value in one message', () => {
    expect(validateAudienceDetails()).toBe(
      `Missing audience ID. Missing advertiser ID. Missing the audience's type. Set the '${AUDIENCE_TYPE_LABEL}' audience setting, or the '${AUDIENCE_TYPE_LABEL}' field in the '${RETL_HOOK_LABEL}' step when syncing from a warehouse`
    )
  })

  it('combines a missing value with an invalid one', () => {
    expect(validateAudienceDetails(undefined, ADVERTISER_ID, 'SOMETHING_ELSE')).toBe(
      `Missing audience ID. Unrecognised audience type: SOMETHING_ELSE. The audience must be ${CONTACT_INFO} or ${DEVICE_ID}`
    )
  })

  // The audience's type reaches the action from the audience settings or the mapping save hook,
  // and the message names both places so a customer knows where to set it.
  it('reports a missing audience type, naming the audience setting and the hook step', () => {
    expect(validateAudienceDetails(AUDIENCE_ID, ADVERTISER_ID)).toBe(
      `Missing the audience's type. Set the '${AUDIENCE_TYPE_LABEL}' audience setting, or the '${AUDIENCE_TYPE_LABEL}' field in the '${RETL_HOOK_LABEL}' step when syncing from a warehouse`
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
      hashedPhoneNumbers: [hashPhone('+12125650000')],
      zipCodes: ['90210'],
      hashedFirstName: hashName('jane'),
      hashedLastName: hashName('doe'),
      // The country code is the one detail Google does not want hashed.
      countryCode: 'US'
    })
  })

  it('hashes every value of a comma separated list', () => {
    expect(
      buildContactInfo({ emails: 'one@example.com, two@example.com', phoneNumbers: '+12125650000, +442070313000' })
    ).toEqual({
      hashedEmails: [hash('one@example.com'), hash('two@example.com')],
      hashedPhoneNumbers: [hashPhone('+12125650000'), hashPhone('+442070313000')]
    })
  })

  // Google rejects a partial address, so the four address details are all or nothing.
  it.each(['zipCodes', 'firstName', 'lastName', 'countryCode'] as const)(
    'drops the address group without %s',
    (field) => {
      const { [field]: _missing, ...partial } = complete

      expect(buildContactInfo(partial)).toEqual({
        hashedEmails: [hash('test@example.com')],
        hashedPhoneNumbers: [hashPhone('+12125650000')]
      })
    }
  )

  it('keeps the address group when it is complete but there is no email or phone', () => {
    const { emails: _emails, phoneNumbers: _phoneNumbers, ...address } = complete

    expect(buildContactInfo(address)).toEqual({
      zipCodes: ['90210'],
      hashedFirstName: hashName('jane'),
      hashedLastName: hashName('doe'),
      countryCode: 'US'
    })
  })

  // An unusable email is dropped, and the user is still synced on whatever survives.
  it('drops the invalid emails and keeps the valid ones', () => {
    expect(buildContactInfo({ emails: 'jane@example.com, not-an-email, jane@' })).toEqual({
      hashedEmails: [hash('jane@example.com')]
    })
  })

  // Normalising is opt in, so by default a phone number is not validated at all: the field asks
  // for E.164 and whatever arrives is hashed and sent. A number Display & Video 360 cannot match
  // is accepted by it and then matches nobody, which is invisible either way.
  it('sends a phone number without reformatting it', () => {
    expect(buildContactInfo({ phoneNumbers: '(212) 565-0000, notaphone' })).toEqual({
      hashedPhoneNumbers: [hashPhone('(212) 565-0000'), hashPhone('notaphone')]
    })
  })

  // An entry which is empty once trimmed is dropped from the list rather than hashed, so a
  // trailing comma or a blank value cannot become the digest of an empty string.
  it('sends nothing for a list of phone numbers which are all empty', () => {
    expect(buildContactInfo({ phoneNumbers: ' , , ' })).toBeUndefined()
    expect(buildContactInfo({ phoneNumbers: '' })).toBeUndefined()
  })

  it('drops the empty entries of a phone number list and keeps the rest', () => {
    expect(buildContactInfo({ phoneNumbers: '+12125650000, , +442070313000,' })).toEqual({
      hashedPhoneNumbers: [hashPhone('+12125650000'), hashPhone('+442070313000')]
    })
  })

  // Only the ends are trimmed. Spaces inside the number are left where they are, so a number
  // written with them hashes differently from the same number without them.
  it('trims a phone number before hashing but leaves the spacing inside it', () => {
    expect(buildContactInfo({ phoneNumbers: ' +12125650000 ' })).toEqual({
      hashedPhoneNumbers: [hashPhone('+12125650000')]
    })
    expect(buildContactInfo({ phoneNumbers: '+1 212 565 0000' })).toEqual({
      hashedPhoneNumbers: [hashPhone('+1 212 565 0000')]
    })
  })

  // Nothing survives, so the event has no usable identifier and buildMember fails it.
  it('returns undefined when the only email is invalid', () => {
    expect(buildContactInfo({ emails: 'not-an-email' })).toBeUndefined()
  })

  // The country code is the one address detail sent unhashed, so it is tidied on the way out
  // rather than relying on the mapping to be clean.
  it('trims and uppercases the country code it sends', () => {
    expect(buildContactInfo({ zipCodes: '90210', firstName: 'Jane', lastName: 'Doe', countryCode: ' us ' })).toEqual({
      zipCodes: ['90210'],
      hashedFirstName: hashName('jane'),
      hashedLastName: hashName('doe'),
      countryCode: 'US'
    })
  })

  // A value of only spaces is truthy, so without trimming first it counts as present: the names
  // hash to the digest of an empty string and the country code is sent as ''. Display & Video 360
  // reads that as an address which is only partly there and rejects the entire request, which
  // fails every other event travelling in the same direction, not only this one.
  it.each(['firstName', 'lastName', 'countryCode'] as const)(
    'drops the address group when %s is only whitespace',
    (field) => {
      const contactInfo = buildContactInfo({
        emails: 'jane@example.com',
        zipCodes: '90210',
        firstName: 'Jane',
        lastName: 'Doe',
        countryCode: 'US',
        [field]: '   '
      })

      // The email still syncs the user: only the address group is dropped.
      expect(contactInfo).toEqual({ hashedEmails: [hash('jane@example.com')] })
    }
  )

  it('trims the names it hashes, so a padded name matches an unpadded one', () => {
    expect(
      buildContactInfo({ zipCodes: '90210', firstName: '  Jane  ', lastName: '  Doe  ', countryCode: 'US' })
    ).toEqual({
      zipCodes: ['90210'],
      hashedFirstName: hashName('jane'),
      hashedLastName: hashName('doe'),
      countryCode: 'US'
    })
  })

  // The destination's other four actions trim names rather than stripping every space, and they
  // write to the same audiences. A name hashed without its spacing here would not match one added
  // there, and Display & Video 360 reports an unmatched member as a success.
  it('keeps the spacing inside a name, matching the destination other actions', () => {
    const contactInfo = buildContactInfo({
      zipCodes: '90210',
      firstName: 'Mary Jane',
      lastName: 'Van Dyke',
      countryCode: 'US'
    })

    expect(contactInfo).toEqual({
      zipCodes: ['90210'],
      hashedFirstName: hashName('mary jane'),
      hashedLastName: hashName('van dyke'),
      countryCode: 'US'
    })

    expect(contactInfo?.hashedFirstName).not.toEqual(hash('mary jane'))
  })

  // The hash helper in this file mirrors the implementation, so these anchor the digests
  // against SHA-256 of the normalised value. Without them a change to how values are
  // normalised before hashing would move both sides at once and go unnoticed.
  it('hashes each identifier as SHA-256 of its normalised value', () => {
    expect(
      buildContactInfo({
        emails: ' Test@Example.COM ',
        phoneNumbers: '+12125650000',
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
        phoneNumbers: hashPhone('+12125650000'),
        zipCodes: '90210',
        firstName: hashName('jane'),
        lastName: hashName('doe'),
        countryCode: 'US'
      })
    ).toEqual({
      hashedEmails: [hash('test@example.com')],
      hashedPhoneNumbers: [hashPhone('+12125650000')],
      zipCodes: ['90210'],
      hashedFirstName: hashName('jane'),
      hashedLastName: hashName('doe'),
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
        phoneNumbers: `+12125650000, ${hashPhone('+442070313000')}`
      })
    ).toEqual({
      hashedEmails: [hash('one@example.com'), hash('two@example.com')],
      hashedPhoneNumbers: [hashPhone('+12125650000'), hashPhone('+442070313000')]
    })
  })

  it.each([undefined, {}, { emails: '' }, { zipCodes: '90210' }])(
    'returns undefined when %p yields no usable identifier',
    (mappedContactInfo?: Payload['contact_info']) => {
      expect(buildContactInfo(mappedContactInfo)).toBeUndefined()
    }
  )
})

describe('normalisePhone', () => {
  const NORMALIZE = { normalization: PHONE_NORMALIZATION_NORMALIZE }
  const VALIDATE = { normalization: PHONE_NORMALIZATION_VALIDATE }

  // A number already hashed cannot be normalised, and rewriting it would destroy it.
  it.each<PhoneOptions | undefined>([undefined, NORMALIZE, VALIDATE])(
    'leaves an already hashed number alone (%p)',
    (phoneOptions: PhoneOptions | undefined) => {
      const hashed = hash('+12125650000')

      expect(normalisePhone(hashed, phoneOptions, 'US')).toBe(hashed)
    }
  )

  // An empty value would otherwise survive as '' and be hashed into the digest of an empty
  // string, which Display & Video 360 accepts and can never match.
  it.each<PhoneOptions | undefined>([undefined, NORMALIZE, VALIDATE])(
    'drops a value which is empty once trimmed (%p)',
    (phoneOptions: PhoneOptions | undefined) => {
      expect(normalisePhone('', phoneOptions, 'US')).toBeUndefined()
      expect(normalisePhone('   ', phoneOptions, 'US')).toBeUndefined()
    }
  )

  // The default has to keep behaving exactly as it did before normalising existed.
  it.each<PhoneOptions | undefined>([undefined, { normalization: PHONE_NORMALIZATION_NONE }])(
    'trims but does not reformat when normalising is off (%p)',
    (phoneOptions: PhoneOptions | undefined) => {
      expect(normalisePhone(' (212) 565-0000 ', phoneOptions, 'US')).toBe('(212) 565-0000')
    }
  )

  // The country is only needed to resolve a national format, so a number which already carries
  // its own country code normalises without one.
  it('converts a number already in E.164 without needing a country', () => {
    expect(normalisePhone('+1 (212) 565-0000', NORMALIZE)).toBe('+12125650000')
    expect(normalisePhone('+44 20 7031 3000', VALIDATE)).toBe('+442070313000')
  })

  it('converts a national format against the default country', () => {
    expect(normalisePhone('(212) 565-0000', { ...NORMALIZE, defaultCountryCode: 'US' })).toBe('+12125650000')
    expect(normalisePhone('020 7031 3000', { ...VALIDATE, defaultCountryCode: 'GB' })).toBe('+442070313000')
  })

  // The region is only ever consulted for a number which cannot be resolved without one, so a
  // country which disagrees with the number cannot corrupt it.
  it('ignores the country entirely for a number already in E.164', () => {
    expect(normalisePhone('+442070313000', { ...VALIDATE, defaultCountryCode: 'US' })).toBe('+442070313000')
    expect(normalisePhone('+12125650000', { ...VALIDATE, defaultCountryCode: 'GB' })).toBe('+12125650000')
    expect(
      normalisePhone('+442070313000', { ...NORMALIZE, useContactInfoCountryCode: true, defaultCountryCode: 'US' }, 'US')
    ).toBe('+442070313000')
  })

  // 00 states the number's own country, so it is read the same way whatever country is set -
  // including none at all.
  it('converts a 00 international prefix whatever the country is', () => {
    expect(normalisePhone('00442070313000', { ...VALIDATE, defaultCountryCode: 'GB' })).toBe('+442070313000')
    expect(normalisePhone('00442070313000', { ...VALIDATE, defaultCountryCode: 'US' })).toBe('+442070313000')
    expect(normalisePhone('00442070313000', { ...VALIDATE, defaultCountryCode: 'JP' })).toBe('+442070313000')
    expect(normalisePhone('00442070313000', VALIDATE)).toBe('+442070313000')
    expect(normalisePhone('0012125650000', { ...VALIDATE, defaultCountryCode: 'GB' })).toBe('+12125650000')
  })

  // + and 00 are the only two ways a number states its own country. Anything else a caller might
  // dial to reach it - 0011 from Australia, 810 from Russia - says where the call was made from,
  // not whose number it is, so it is not a form we accept.
  it.each(['0011442070313000', '001442070313000', '000442070313000', '810442070313000'])(
    'does not treat %s as an international number',
    (phone: string) => {
      expect(normalisePhone(phone, { ...VALIDATE, defaultCountryCode: 'GB' })).toBeUndefined()
      expect(normalisePhone(phone, VALIDATE)).toBeUndefined()
    }
  )

  // 0113 and 0117 are real United Kingdom area codes, which is why a leading 011 is never read
  // as the start of a country code.
  it('reads a local number which begins 011 as the local number it is', () => {
    expect(normalisePhone('01134960000', { ...VALIDATE, defaultCountryCode: 'GB' })).toBe('+441134960000')
    expect(normalisePhone('01174960000', { ...VALIDATE, defaultCountryCode: 'GB' })).toBe('+441174960000')
  })

  it('leaves a 00 which is not a phone number at all to fail like any other', () => {
    expect(normalisePhone('00notaphone', { ...NORMALIZE, defaultCountryCode: 'US' })).toBe('00notaphone')
    expect(normalisePhone('00notaphone', { ...VALIDATE, defaultCountryCode: 'US' })).toBeUndefined()
  })

  // Without a + there is nothing to mark the country code as one, so it is read as national
  // digits and comes out invalid. Normalising sends it as mapped, validating drops it.
  it('does not convert a bare country code written without a plus', () => {
    expect(normalisePhone('442070313000', { ...NORMALIZE, defaultCountryCode: 'US' })).toBe('442070313000')
    expect(normalisePhone('442070313000', { ...VALIDATE, defaultCountryCode: 'US' })).toBeUndefined()
    expect(normalisePhone('12125650000', { ...VALIDATE, defaultCountryCode: 'GB' })).toBeUndefined()
  })

  // Without a country a national format cannot be resolved at all, so the two modes part ways:
  // normalising alone sends it untouched, validating drops it.
  it('leaves a national format alone when there is no country to resolve it against', () => {
    expect(normalisePhone('(212) 565-0000', NORMALIZE)).toBe('(212) 565-0000')
    expect(normalisePhone('(212) 565-0000', VALIDATE)).toBeUndefined()
  })

  it('leaves a value which is not a phone number at all alone, and drops it once validation is on', () => {
    expect(normalisePhone('notaphone', { ...NORMALIZE, defaultCountryCode: 'US' })).toBe('notaphone')
    expect(normalisePhone('notaphone', { ...VALIDATE, defaultCountryCode: 'US' })).toBeUndefined()
  })

  // A number can be well formed enough to reformat and still not be a real number. Rewriting one
  // would be a guess, so normalising leaves it exactly as mapped and validating drops it.
  it('leaves a parseable but invalid number alone, and drops it once validation is on', () => {
    expect(normalisePhone('+1 555 123 4567', NORMALIZE)).toBe('+1 555 123 4567')
    expect(normalisePhone('+1 555 123 4567', VALIDATE)).toBeUndefined()
  })

  describe('choosing the country', () => {
    it('ignores the per user country until it is switched on', () => {
      expect(normalisePhone('020 7031 3000', VALIDATE, 'GB')).toBeUndefined()
      expect(normalisePhone('020 7031 3000', { ...VALIDATE, useContactInfoCountryCode: true }, 'GB')).toBe(
        '+442070313000'
      )
    })

    it('prefers the per user country over the default once it is switched on', () => {
      const phoneOptions: PhoneOptions = { ...VALIDATE, useContactInfoCountryCode: true, defaultCountryCode: 'US' }

      expect(normalisePhone('020 7031 3000', phoneOptions, 'GB')).toBe('+442070313000')
    })

    it('falls back to the default country for a user who has none of their own', () => {
      const phoneOptions: PhoneOptions = { ...VALIDATE, useContactInfoCountryCode: true, defaultCountryCode: 'US' }

      expect(normalisePhone('(212) 565-0000', phoneOptions)).toBe('+12125650000')
    })

    // The wrong country would turn a real number into a different, unmatchable one, so neither
    // mode sends it. This is the reason the per user country exists.
    it('never converts a number against the wrong country', () => {
      expect(normalisePhone('020 7031 3000', { ...NORMALIZE, defaultCountryCode: 'US' })).toBe('020 7031 3000')
      expect(normalisePhone('020 7031 3000', { ...VALIDATE, defaultCountryCode: 'US' })).toBeUndefined()
    })
  })
})

describe('buildContactInfo phone normalisation', () => {
  it('hashes the normalised number rather than the one which was mapped', () => {
    expect(
      buildContactInfo(
        { phoneNumbers: '(212) 565-0000' },
        { normalization: PHONE_NORMALIZATION_NORMALIZE, defaultCountryCode: 'US' }
      )
    ).toEqual({ hashedPhoneNumbers: [hashPhone('+12125650000')] })
  })

  // An invalid number is dropped the same way an invalid email is, and the user is still synced
  // on whatever survives.
  it('drops the invalid numbers and keeps the valid ones', () => {
    expect(
      buildContactInfo(
        { emails: 'jane@example.com', phoneNumbers: '(212) 565-0000, notaphone, +1 555 123 4567' },
        { normalization: PHONE_NORMALIZATION_VALIDATE, defaultCountryCode: 'US' }
      )
    ).toEqual({
      hashedEmails: [hash('jane@example.com')],
      hashedPhoneNumbers: [hashPhone('+12125650000')]
    })
  })

  it('reads the per user country from the contact info it is building', () => {
    expect(
      buildContactInfo(
        { phoneNumbers: '020 7031 3000', countryCode: 'gb' },
        { normalization: PHONE_NORMALIZATION_VALIDATE, useContactInfoCountryCode: true, defaultCountryCode: 'US' }
      )
    ).toEqual({ hashedPhoneNumbers: [hashPhone('+442070313000')] })
  })

  it('returns undefined when the only phone number is invalid', () => {
    expect(
      buildContactInfo({ phoneNumbers: 'notaphone' }, { normalization: PHONE_NORMALIZATION_VALIDATE })
    ).toBeUndefined()
  })
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
          hashedPhoneNumbers: [hashPhone('+12125650000')],
          zipCodes: ['90210'],
          hashedFirstName: hashName('jane'),
          hashedLastName: hashName('doe'),
          countryCode: 'US'
        }
      ]
    })
  })

  // Dropping the number leaves nothing to match on, so the event fails with the error the
  // customer sees per event in the event delivery tab rather than failing the whole batch.
  it('fails an event whose only identifier is a phone number dropped by validation', () => {
    const invalidPhone = {
      ...payload,
      contact_info: { phoneNumbers: 'notaphone' },
      phone_options: { normalization: PHONE_NORMALIZATION_VALIDATE }
    } as Payload

    expect(buildMember(invalidPhone, true, target)).toEqual({
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage:
        'No usable contact info identifiers found. This audience requires an email, a phone number, or a complete first name, last name, zip code and country code.'
    })
  })

  it('normalises a phone number using the settings on the payload', () => {
    const nationalFormat = {
      ...payload,
      contact_info: { phoneNumbers: '020 7031 3000', countryCode: 'GB' },
      phone_options: { normalization: PHONE_NORMALIZATION_VALIDATE, useContactInfoCountryCode: true }
    } as Payload

    expect(buildMember(nationalFormat, true, target)).toEqual({
      members: [{ hashedPhoneNumbers: [hashPhone('+442070313000')] }]
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

  it('builds an added contact info list', () => {
    expect(buildJSON(ADVERTISER_ID, CONTACT_INFO, [jane, john], true, consent)).toEqual({
      advertiserId: ADVERTISER_ID,
      addedContactInfoList: { contactInfos: [jane, john], consent }
    })
  })

  // Display & Video 360 rejects a request carrying both lists, so only ever one is built.
  it('builds a removed contact info list', () => {
    expect(buildJSON(ADVERTISER_ID, CONTACT_INFO, [john], false, consent)).toEqual({
      advertiserId: ADVERTISER_ID,
      removedContactInfoList: { contactInfos: [john], consent }
    })
  })

  it('builds an added mobile device ID list for a device ID audience', () => {
    expect(buildJSON(ADVERTISER_ID, DEVICE_ID, ['device-1'], true, consent)).toEqual({
      advertiserId: ADVERTISER_ID,
      addedMobileDeviceIdList: { mobileDeviceIds: ['device-1'], consent }
    })
  })

  it('builds a removed mobile device ID list for a device ID audience', () => {
    expect(buildJSON(ADVERTISER_ID, DEVICE_ID, ['device-2'], false, consent)).toEqual({
      advertiserId: ADVERTISER_ID,
      removedMobileDeviceIdList: { mobileDeviceIds: ['device-2'], consent }
    })
  })

  // An empty consent is what an unmapped consent field produces. Leaving the key off is how
  // Display & Video 360 is told the signals are not specified.
  it.each([{}, undefined])('leaves the consent key off the request for %p', (empty?: Consent) => {
    expect(buildJSON(ADVERTISER_ID, CONTACT_INFO, [jane], true, empty)).toEqual({
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

describe('country choices', () => {
  const values = (choices: { value: string }[]) => choices.map(({ value }) => value)

  it('offers every libphonenumber region as a phone region', () => {
    expect(values(PHONE_REGION_CHOICES)).toEqual(COUNTRIES.map(({ code }) => code))
  })

  it('leaves the codes which are not assigned ISO 3166-1 alpha-2 out of the country choices', () => {
    expect(values(COUNTRY_CHOICES)).not.toContain('AC')
    expect(values(COUNTRY_CHOICES)).not.toContain('TA')
    expect(values(COUNTRY_CHOICES)).not.toContain('XK')
    expect(COUNTRY_CHOICES).toHaveLength(COUNTRIES.length - 3)
  })
})
