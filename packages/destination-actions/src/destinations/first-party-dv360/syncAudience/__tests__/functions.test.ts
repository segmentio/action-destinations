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
    ['Test@Example.com ', 'test@example.com'],
    ['  someone@sub.domain.co.uk', 'someone@sub.domain.co.uk']
  ])('normalises %p', (value: string, expected: string) => {
    expect(normaliseEmail(value)).toBe(expected)
  })

  it.each(['jane', 'jane@', '@example.com', 'jane@example', 'jane doe@example.com', 'jane@exa mple.com'])(
    'drops %p',
    (value: string) => {
      expect(normaliseEmail(value)).toBeUndefined()
    }
  )

  // A digest is not email shaped, so validating one would drop every pre hashed value.
  it('passes an already hashed value through untouched', () => {
    const hashed = hash('jane@example.com')

    expect(normaliseEmail(hashed)).toBe(hashed)
  })
})

describe('normalisePhone', () => {
  it('keeps a number which already carries its country code', () => {
    expect(normalisePhone('+12125650000')).toBe('+12125650000')
  })

  it.each([
    ['(212) 565-0000', 'US'],
    ['212-565-0000', 'US'],
    ['2125650000', 'US']
  ])('reads %p against %p and formats it to E.164', (value: string, region: string) => {
    expect(normalisePhone(value, region)).toBe('+12125650000')
  })

  it('reads a national number against the country it is given', () => {
    expect(normalisePhone('02070313000', 'GB')).toBe('+442070313000')
  })

  // The user's own country code is preferred over the mapping's fallback.
  it('prefers the first country it is given', () => {
    expect(normalisePhone('02070313000', 'GB', 'US')).toBe('+442070313000')
  })

  it('falls back to the next country when the first is not set', () => {
    expect(normalisePhone('2125650000', undefined, 'US')).toBe('+12125650000')
  })

  it.each(['us', ' US ', 'Us'])('accepts %p as a country, whatever the case or spacing', (region: string) => {
    expect(normalisePhone('2125650000', region)).toBe('+12125650000')
  })

  // Ignored rather than guessed at, so the number is dropped instead of being read against the
  // wrong country.
  it.each(['USA', 'UK', 'United States', 'ZZ', ''])('ignores %p as a country', (region: string) => {
    expect(normalisePhone('2125650000', region)).toBeUndefined()
  })

  it('falls back to the mapping country when the user country is not recognised', () => {
    expect(normalisePhone('2125650000', 'USA', 'US')).toBe('+12125650000')
  })

  // Guessing the country would hash to a number which silently never matches.
  it('drops a national number when no country is known', () => {
    expect(normalisePhone('2125650000')).toBeUndefined()
  })

  it.each(['+15555555555', 'notaphone', '+1', '12345'])('drops %p as not a valid number', (value: string) => {
    expect(normalisePhone(value, 'US')).toBeUndefined()
  })

  it('passes an already hashed value through untouched', () => {
    const hashed = hash('+12125650000')

    expect(normalisePhone(hashed)).toBe(hashed)
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

  it('does not hash a value which is already hashed, and lowercases the digest', () => {
    expect(buildContactInfo({ emails: hash('test@example.com').toUpperCase() })).toEqual({
      hashedEmails: [hash('test@example.com')]
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
