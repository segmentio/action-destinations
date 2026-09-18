import { MultiStatusResponse, ErrorCodes, IntegrationError, RetryableError } from '@segment/actions-core'
import {
  validateAudienceDetails,
  buildContactInfo,
  buildConsent,
  buildJSON,
  buildMember,
  errorTypeForStatus,
  normaliseEmail,
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

const hashName = (value: string): string => processHashing(value, 'sha256', 'hex', (v) => v.trim().toLowerCase())

const hashPhone = (value: string): string => processHashing(value, 'sha256', 'hex')

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
  it("reports a missing audience type, naming the audience setting and the hook step", () => {
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

  // Phone numbers are not validated at all: the field asks for E.164 and whatever arrives is
  // hashed and sent. A number Display & Video 360 cannot match is accepted by it and then
  // matches nobody, which is invisible either way.
  it('sends a phone number exactly as it was given', () => {
    expect(buildContactInfo({ phoneNumbers: '(212) 565-0000, notaphone' })).toEqual({
      hashedPhoneNumbers: [hashPhone('(212) 565-0000'), hashPhone('notaphone')]
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
