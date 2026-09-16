import nock from 'nock'
import {
  createTestEvent,
  createTestIntegration,
  FLAGS,
  IntegrationError,
  InvalidAudienceMembershipError,
  RetryableError
} from '@segment/actions-core'
import Destination from '../../index'
import type { Payload } from '../generated-types'
import { processHashing } from '../../../../lib/hashing-utils'
import { AUDIENCE_TYPE_LABEL } from '../constants'

const testDestination = createTestIntegration(Destination)

const ADVERTISER_ID = '12345'
const AUDIENCE_ID = '98765'
const CONTACT_INFO = 'CUSTOMER_MATCH_CONTACT_INFO'
const DEVICE_ID = 'CUSTOMER_MATCH_DEVICE_ID'
const LEGACY_JOURNEYS_FLAG = FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP
const DV360_HOST = 'https://displayvideo.googleapis.com'
const EDIT_PATH = `/v4/firstPartyAndPartnerAudiences/${AUDIENCE_ID}:editCustomerMatchMembers`

const hash = (value: string): string =>
  processHashing(value, 'sha256', 'hex', (v) => v.replace(/\s+/g, '').toLowerCase())

// The identifier and consent options are the action's own field types, so a change to either
// shape shows up here rather than leaving these tests mapping traits which no longer exist.
type ContactInfoOptions = NonNullable<Payload['contact_info']>
type ConsentOptions = NonNullable<Payload['consent']>

interface EventOptions extends ContactInfoOptions, ConsentOptions {
  // null omits the membership boolean entirely, which is what a legacy Journeys payload looks
  // like. undefined falls back to the default of true.
  membership?: boolean | null
  audienceType?: string
  computationClass?: string
  type?: 'track' | 'identify'
  advertiserId?: string
  defaultCountryCode?: string
  useContactInfoCountryCode?: boolean
  mobileDeviceIds?: Payload['mobileDeviceIds']
  // A string is used deliberately by one test to fail the framework's boolean validation
  // before performBatch is reached.
  enableBatching?: boolean | string
}

const makeEvent = ({
  membership = true,
  audienceType = CONTACT_INFO,
  advertiserId = ADVERTISER_ID,
  computationClass = 'journey_step',
  type = 'track',
  emails,
  phoneNumbers,
  mobileDeviceIds,
  firstName,
  lastName,
  zipCodes,
  countryCode,
  adUserData = GRANTED,
  adPersonalization = GRANTED,
  // Both are unset by default, as the field itself is: a number with no country code is
  // dropped rather than read against a guessed country.
  defaultCountryCode,
  useContactInfoCountryCode,
  enableBatching = true
}: EventOptions = {}) =>
  createTestEvent({
    type,
    event: 'Audience Entered',
    context: {
      personas: {
        computation_class: computationClass,
        computation_key: 'my_audience',
        external_audience_id: AUDIENCE_ID,
        audience_settings: {
          advertiserId,
          audienceType
        }
      },
      traits: {
        emails,
        phoneNumbers,
        mobileDeviceIds,
        firstName,
        lastName,
        zipCodes,
        countryCode
      }
    },
    ...(type === 'identify' && membership !== null ? { traits: { my_audience: membership } } : {}),
    properties: {
      ...(membership === null || type === 'identify' ? {} : { my_audience: membership }),
      ...(adUserData ? { adUserData } : {}),
      ...(adPersonalization ? { adPersonalization } : {}),
      ...(defaultCountryCode ? { defaultCountryCode } : {}),
      ...(useContactInfoCountryCode === undefined ? {} : { useContactInfoCountryCode }),
      enableBatching
    }
  })

const mapping = {
  audience_type: CONTACT_INFO,
  contact_info: {
    emails: { '@path': '$.context.traits.emails' },
    phoneNumbers: { '@path': '$.context.traits.phoneNumbers' },
    firstName: { '@path': '$.context.traits.firstName' },
    lastName: { '@path': '$.context.traits.lastName' },
    zipCodes: { '@path': '$.context.traits.zipCodes' },
    countryCode: { '@path': '$.context.traits.countryCode' }
  },
  mobileDeviceIds: { '@path': '$.context.traits.mobileDeviceIds' },
  phone_number_settings: {
    defaultCountryCode: { '@path': '$.properties.defaultCountryCode' },
    useContactInfoCountryCode: { '@path': '$.properties.useContactInfoCountryCode' }
  },
  // The consent field has no default, so it is mapped straight from the event.
  consent: {
    adUserData: { '@path': '$.properties.adUserData' },
    adPersonalization: { '@path': '$.properties.adPersonalization' }
  },
  external_id: { '@path': '$.context.personas.external_audience_id' },
  // Both are hidden fields which default to these values. enable_batching is mapped from the
  // event rather than hardcoded so that a test can send a non boolean and have the framework
  // reject the event before performBatch is reached.
  enable_batching: { '@path': '$.properties.enableBatching' },
  batch_size: 500000
}

// A copy of the mapping with the consent field absent, rather than set to undefined.
const { consent: _consent, ...mappingWithoutConsent } = mapping

const GRANTED = 'CONSENT_STATUS_GRANTED'

const GRANTED_CONSENT = {
  adUserData: GRANTED,
  adPersonalization: GRANTED
}

const API_RESPONSE = { firstPartyAndPartnerAudienceId: AUDIENCE_ID }

// A mixed batch goes out as one request, so tests capture the single body sent.
// The message alone does not say which error was thrown, and the class is what decides
// whether the delivery layer retries the event or discards it.
const rejectionOf = async (promise: Promise<unknown>) => {
  try {
    await promise
  } catch (error) {
    return error as Error & { code?: string; status?: number }
  }

  throw new Error('expected the action to throw, but it resolved')
}

const captureBody = () => {
  const captured: { body?: any } = {}
  const scope = nock(DV360_HOST)
    .post(EDIT_PATH, (b) => {
      captured.body = b
      return true
    })
    .once()
    .reply(200, API_RESPONSE)
  return { captured, scope }
}

afterEach(() => {
  nock.cleanAll()
})

describe('FirstPartyDv360.syncAudience', () => {
  // A single event goes through perform, which has no MultiStatusResponse to report into:
  // it either returns the response or throws.
  describe('perform, a single event', () => {
    it('reports the status Display & Video 360 returned, rather than assuming 200', async () => {
      nock(DV360_HOST).post(EDIT_PATH).reply(201, API_RESPONSE)

      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [makeEvent({ membership: true, emails: 'a@example.com' })],
        mapping
      })

      expect(responses[0].status).toBe(201)
    })

    it('adds a contact info member', async () => {
      let body: any
      nock(DV360_HOST)
        .post(EDIT_PATH, (b) => {
          body = b
          return true
        })
        .reply(200, API_RESPONSE)

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: true, emails: 'Test@Example.com ' }),
        mapping,
        useDefaultMappings: false
      })

      expect(body).toEqual({
        advertiserId: ADVERTISER_ID,
        addedContactInfoList: {
          contactInfos: [{ hashedEmails: [hash('test@example.com')] }],
          consent: GRANTED_CONSENT
        }
      })
    })

    it('removes a contact info member', async () => {
      let body: any
      nock(DV360_HOST)
        .post(EDIT_PATH, (b) => {
          body = b
          return true
        })
        .reply(200, API_RESPONSE)

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: false, emails: 'test@example.com' }),
        mapping,
        useDefaultMappings: false
      })

      expect(body).toEqual({
        advertiserId: ADVERTISER_ID,
        removedContactInfoList: {
          contactInfos: [{ hashedEmails: [hash('test@example.com')] }],
          consent: GRANTED_CONSENT
        }
      })
    })

    it('does not hash an already hashed email', async () => {
      const hashedEmail = hash('test@example.com')
      let body: any
      nock(DV360_HOST)
        .post(EDIT_PATH, (b) => {
          body = b
          return true
        })
        .reply(200, API_RESPONSE)

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: true, emails: hashedEmail }),
        mapping,
        useDefaultMappings: false
      })

      expect(body.addedContactInfoList.contactInfos[0].hashedEmails).toEqual([hashedEmail])
    })

    it('splits a comma separated list into several identifiers', async () => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: true, emails: 'one@example.com, two@example.com ,three@example.com' }),
        mapping,
        useDefaultMappings: false
      })

      expect(captured.body.addedContactInfoList.contactInfos).toEqual([
        {
          hashedEmails: [hash('one@example.com'), hash('two@example.com'), hash('three@example.com')]
        }
      ])
    })

    it('lowercases an already hashed value sent in upper case', async () => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: true, emails: hash('test@example.com').toUpperCase() }),
        mapping,
        useDefaultMappings: false
      })

      expect(captured.body.addedContactInfoList.contactInfos[0].hashedEmails).toEqual([hash('test@example.com')])
    })

    it('omits consent when the mapping does not carry it', async () => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: true, emails: 'a@example.com' }),
        // The consent field is deliberately left unmapped.
        mapping: mappingWithoutConsent,
        useDefaultMappings: false
      })

      expect(captured.body.addedContactInfoList.consent).toBeUndefined()
      expect(captured.body.addedContactInfoList.contactInfos).toEqual([{ hashedEmails: [hash('a@example.com')] }])
    })

    it('sends only the consent fields the event carries', async () => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ membership: true, emails: 'a@example.com' }),
        mapping: { ...mapping, consent: { adUserData: mapping.consent.adUserData } },
        useDefaultMappings: false
      })

      expect(captured.body.addedContactInfoList.consent).toEqual({ adUserData: 'CONSENT_STATUS_GRANTED' })
    })

    // A national number needs a country before it can be sent. These cover the field end to
    // end: the unit tests cover normalisePhone itself.
    it('sends a national number using the default country', async () => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ phoneNumbers: '(212) 565-0000', defaultCountryCode: 'US' }),
        mapping,
        useDefaultMappings: false
      })

      expect(captured.body.addedContactInfoList.contactInfos).toEqual([{ hashedPhoneNumbers: [hash('+12125650000')] }])
    })

    it("sends a national number using the user's own country code when the mapping opts in", async () => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({
          phoneNumbers: '020 7031 3000',
          zipCodes: 'SW1A 1AA',
          firstName: 'Jane',
          lastName: 'Doe',
          countryCode: 'GB',
          useContactInfoCountryCode: true
        }),
        mapping,
        useDefaultMappings: false
      })

      expect(captured.body.addedContactInfoList.contactInfos[0].hashedPhoneNumbers).toEqual([hash('+442070313000')])
    })

    // Neither setting applies, so the number cannot be read and this event has nothing else.
    it('throws for a single event whose only identifier is a number with no country', async () => {
      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent({ phoneNumbers: '(212) 565-0000' }),
          mapping,
          useDefaultMappings: false
        })
      ).rejects.toThrow('No usable contact info identifiers')
    })

    it('throws for a single event with no usable identifier', async () => {
      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent({ membership: true }),
          mapping,
          useDefaultMappings: false
        })
      ).rejects.toThrow('No usable contact info identifiers')
    })

    it('throws for a single event whose membership cannot be resolved', async () => {
      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent({ membership: null, emails: 'a@example.com' }),
          mapping,
          useDefaultMappings: false
        })
      ).rejects.toThrow(InvalidAudienceMembershipError)
    })

    // The audience the members are sent to comes from external_id. Unmapped, and with no hook
    // output to fall back on, there is no audience to sync to at all.
    it('throws when the audience ID is not mapped', async () => {
      const { external_id: _externalId, ...mappingWithoutAudienceId } = mapping

      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent({ membership: true, emails: 'a@example.com' }),
          mapping: mappingWithoutAudienceId,
          useDefaultMappings: false
        })
      ).rejects.toThrow('Missing audience ID')
    })

    // There is no advertiser field in the mapping to take this from: it is read from the
    // audience settings on the event. A value distinct from every other ID in the fixture
    // proves that is where it came from.
    it('takes the advertiser ID from the audience settings', async () => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({
          membership: true,
          emails: 'a@example.com',
          advertiserId: 'advertiser-from-audience-settings'
        }),
        mapping,
        useDefaultMappings: false
      })

      expect(captured.body.advertiserId).toBe('advertiser-from-audience-settings')
    })

    // audience_type is required, so the framework rejects the event before the action runs.
    // This is what makes the mapped type safe to treat as always present.
    it('throws for a single event when the audience type is unmapped', async () => {
      const { audience_type: _type, ...mappingWithoutType } = mapping

      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent({ membership: true, emails: 'a@example.com' }),
          mapping: mappingWithoutType,
          useDefaultMappings: false
        })
      ).rejects.toThrow("missing the required field 'audience_type'")
    })

    it('throws a retryable error for a single event on a 5xx', async () => {
      nock(DV360_HOST).post(EDIT_PATH).reply(500, {})

      const error = await rejectionOf(
        testDestination.testAction('syncAudience', {
          event: makeEvent({ membership: true, emails: 'a@example.com' }),
          mapping,
          useDefaultMappings: false
        })
      )

      // A RetryableError is retried. An IntegrationError carrying the same message would be
      // discarded, so the class is the assertion which matters here.
      expect(error).toBeInstanceOf(RetryableError)
      expect(error.code).toBe('RETRYABLE_ERROR')
      expect(error.status).toBe(500)
      expect(error.message).toBe('Display & Video 360 rejected the request')
    })

    it('throws a non retryable error for a single event on a 4xx', async () => {
      nock(DV360_HOST)
        .post(EDIT_PATH)
        .reply(400, { error: { message: 'Invalid advertiser' } })

      const error = await rejectionOf(
        testDestination.testAction('syncAudience', {
          event: makeEvent({ membership: true, emails: 'a@example.com' }),
          mapping,
          useDefaultMappings: false
        })
      )

      expect(error).not.toBeInstanceOf(RetryableError)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.code).toBe('BAD_REQUEST')
      expect(error.status).toBe(400)
    })

    it('throws an authentication error for a single event on a 401, so the token is refreshed', async () => {
      nock(DV360_HOST)
        .post(EDIT_PATH)
        .reply(401, { error: { message: 'Invalid Credentials' } })

      const error = await rejectionOf(
        testDestination.testAction('syncAudience', {
          event: makeEvent({ membership: true, emails: 'a@example.com' }),
          mapping,
          useDefaultMappings: false
        })
      )

      expect(error.code).toBe('INVALID_AUTHENTICATION')
      expect(error.status).toBe(401)
    })
  })

  // A batch goes through performBatch, which reports the outcome of every event by index.
  describe('performBatch, a batch of events', () => {
    it('sends adds and removes in a single request for a mixed batch', async () => {
      const { captured, scope } = captureBody()

      await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [
          makeEvent({ membership: true, emails: 'add1@example.com' }),
          makeEvent({ membership: false, emails: 'remove1@example.com' }),
          makeEvent({ membership: true, emails: 'add2@example.com' })
        ],
        mapping
      })

      expect(scope.isDone()).toBe(true)
      expect(captured.body).toEqual({
        advertiserId: ADVERTISER_ID,
        addedContactInfoList: {
          contactInfos: [{ hashedEmails: [hash('add1@example.com')] }, { hashedEmails: [hash('add2@example.com')] }],
          consent: GRANTED_CONSENT
        },
        removedContactInfoList: {
          contactInfos: [{ hashedEmails: [hash('remove1@example.com')] }],
          consent: GRANTED_CONSENT
        }
      })
    })

    it('omits the removed list when a batch is all adds', async () => {
      const { captured, scope } = captureBody()

      await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [
          makeEvent({ membership: true, emails: 'add1@example.com' }),
          makeEvent({ membership: true, emails: 'add2@example.com' })
        ],
        mapping
      })

      expect(scope.isDone()).toBe(true)
      expect(captured.body.removedContactInfoList).toBeUndefined()
    })

    it('sends mobile device IDs for a device ID audience', async () => {
      const { captured } = captureBody()

      await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [
          makeEvent({ membership: true, audienceType: DEVICE_ID, mobileDeviceIds: 'device-1' }),
          makeEvent({ membership: false, audienceType: DEVICE_ID, mobileDeviceIds: 'device-2' })
        ],
        mapping: { ...mapping, audience_type: DEVICE_ID }
      })

      expect(captured.body).toEqual({
        advertiserId: ADVERTISER_ID,
        addedMobileDeviceIdList: { mobileDeviceIds: ['device-1'], consent: GRANTED_CONSENT },
        removedMobileDeviceIdList: { mobileDeviceIds: ['device-2'], consent: GRANTED_CONSENT }
      })
    })

    it('only sends the address group when it is complete', async () => {
      let body: any
      nock(DV360_HOST)
        .post(EDIT_PATH, (b) => {
          body = b
          return true
        })
        .reply(200, API_RESPONSE)

      await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [
          makeEvent({
            membership: true,
            emails: 'complete@example.com',
            firstName: 'Jane',
            lastName: 'Doe',
            zipCodes: '90210',
            countryCode: 'US'
          }),
          // Partial address. Google rejects zipCodes without the name and country fields,
          // so the address group is dropped and only the email is sent.
          makeEvent({ membership: true, emails: 'partial@example.com', zipCodes: '90210' })
        ],
        mapping
      })

      expect(body.addedContactInfoList.contactInfos).toEqual([
        {
          hashedEmails: [hash('complete@example.com')],
          hashedFirstName: hash('jane'),
          hashedLastName: hash('doe'),
          zipCodes: ['90210'],
          countryCode: 'US'
        },
        { hashedEmails: [hash('partial@example.com')] }
      ])
    })

    it('fails the whole batch when consent is denied', async () => {
      const scope = nock(DV360_HOST).post(EDIT_PATH).reply(200, API_RESPONSE)

      // batch_keys pins a batch to one combination of consent values, so a batch carrying denied
      // consent carries it on every event.
      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [
          makeEvent({ membership: true, emails: 'a@example.com', adUserData: 'CONSENT_STATUS_DENIED' }),
          makeEvent({ membership: true, emails: 'b@example.com', adUserData: 'CONSENT_STATUS_DENIED' })
        ],
        mapping
      })

      // Consent belongs to the list, so a denied event cannot be dropped while the rest are sent.
      expect(scope.isDone()).toBe(false)
      expect(responses[0].status).toBe(400)
      expect(responses[1].status).toBe(400)
      expect((responses[0] as any).errormessage).toContain('Consent denied')
    })

    it('drops an event belonging to a different audience', async () => {
      const { captured } = captureBody()

      const otherAudienceEvent = makeEvent({ membership: true, emails: 'other@example.com' })
      ;(otherAudienceEvent.context as any).personas.external_audience_id = 'a-different-audience'

      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [makeEvent({ membership: true, emails: 'right@example.com' }), otherAudienceEvent],
        mapping
      })

      expect(captured.body.addedContactInfoList.contactInfos).toEqual([{ hashedEmails: [hash('right@example.com')] }])
      expect(responses[1].status).toBe(400)
      expect((responses[1] as any).errormessage).toContain('does not belong to the same audience')
    })

    it('fails the batch when the mapped audience type disagrees with the audience', async () => {
      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [makeEvent({ membership: true, audienceType: DEVICE_ID, mobileDeviceIds: 'device-1' })],
        mapping
      })

      expect(responses).toEqual([
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errorreporter: 'INTEGRATIONS',
          errormessage: `The '${AUDIENCE_TYPE_LABEL}' mapping field is set to ${CONTACT_INFO}, but the audience in Display & Video 360 is ${DEVICE_ID}. Set the '${AUDIENCE_TYPE_LABEL}' mapping field to ${DEVICE_ID} so that the mapping shows the identifier fields that audience accepts, or connect this mapping to a ${CONTACT_INFO} audience`
        }
      ])
    })

    it('drops an event with an unmapped audience type from a batch', async () => {
      const { audience_type: _type, ...mappingWithoutType } = mapping
      const scope = nock(DV360_HOST).post(EDIT_PATH).reply(200, API_RESPONSE)

      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [makeEvent({ membership: true, emails: 'a@example.com' })],
        mapping: mappingWithoutType
      })

      expect(scope.isDone()).toBe(false)
      expect(responses).toEqual([
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errorreporter: 'INTEGRATIONS',
          errormessage: expect.stringContaining("missing the required field 'audience_type'")
        }
      ])
    })

    it('rejects an unrecognised audience type before sending', async () => {
      const scope = nock(DV360_HOST).post(EDIT_PATH).reply(200, API_RESPONSE)

      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [makeEvent({ membership: true, emails: 'a@example.com', audienceType: 'SOMETHING_ELSE' })],
        mapping
      })

      expect(scope.isDone()).toBe(false)
      expect(responses[0].status).toBe(400)
      expect((responses[0] as any).errormessage).toContain('Unrecognised audience type')
    })

    it('makes no request when every event fails validation', async () => {
      const scope = nock(DV360_HOST).post(EDIT_PATH).reply(200, API_RESPONSE)

      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [makeEvent({ membership: true }), makeEvent({ membership: true })],
        mapping
      })

      expect(scope.isDone()).toBe(false)
      expect(responses[0].status).toBe(400)
      expect(responses[1].status).toBe(400)
    })

    it('reports a 4xx from Display & Video 360 against every sent event', async () => {
      nock(DV360_HOST)
        .post(EDIT_PATH)
        .reply(400, { error: { code: 400, message: 'Invalid advertiser', status: 'INVALID_ARGUMENT' } })

      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [
          makeEvent({ membership: true, emails: 'a@example.com' }),
          makeEvent({ membership: false, emails: 'b@example.com' })
        ],
        mapping
      })

      expect(responses[0].status).toBe(400)
      expect((responses[0] as any).errormessage).toBe('Invalid advertiser')
      expect((responses[1] as any).errormessage).toBe('Invalid advertiser')
    })

    it('reports a 401 so the token is refreshed and the batch retried', async () => {
      nock(DV360_HOST)
        .post(EDIT_PATH)
        .reply(401, { error: { code: 401, message: 'Invalid Credentials' } })

      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [makeEvent({ membership: true, emails: 'a@example.com' })],
        mapping
      })

      // Core looks for a 401 in the MultiStatusResponse to trigger a token refresh and retry.
      expect(responses[0].status).toBe(401)
      expect((responses[0] as any).errortype).toBe('INVALID_AUTHENTICATION')
    })

    it('reports a 5xx as a retryable error against every sent event', async () => {
      nock(DV360_HOST).post(EDIT_PATH).reply(500, {})

      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [
          makeEvent({ membership: true, emails: 'a@example.com' }),
          makeEvent({ membership: false, emails: 'b@example.com' })
        ],
        mapping
      })

      expect(responses[0].status).toBe(500)
      expect((responses[0] as any).errortype).toBe('RETRYABLE_ERROR')
      expect((responses[1] as any).errortype).toBe('RETRYABLE_ERROR')
    })

    it('fully asserts the MultiStatusResponse for a mixed batch of 10 events', async () => {
      const { captured, scope } = captureBody()

      const otherAudienceEvent = makeEvent({ membership: true, emails: 'otheraudience@example.com' })
      ;(otherAudienceEvent.context as any).personas.external_audience_id = 'a-different-audience'

      const events = [
        // 0 add, sent
        makeEvent({ membership: true, emails: 'add1@example.com' }),
        // 1 remove, sent
        makeEvent({ membership: false, emails: 'remove1@example.com' }),
        // 2 dropped BEFORE performBatch: enable_batching is required and is not a boolean
        makeEvent({ membership: true, emails: 'nobatching1@example.com', enableBatching: 'yes' }),
        // 3 add, sent
        makeEvent({ membership: true, phoneNumbers: '+12125650000' }),
        // 4 dropped INSIDE performBatch: no usable identifier
        makeEvent({ membership: true }),
        // 5 remove, sent
        makeEvent({ membership: false, emails: 'remove2@example.com' }),
        // 6 dropped INSIDE performBatch: membership cannot be resolved to a boolean
        makeEvent({ membership: null, emails: 'nomembership@example.com' }),
        // 7 dropped BEFORE performBatch: enable_batching is required and is not a boolean
        makeEvent({ membership: false, emails: 'nobatching2@example.com', enableBatching: 'yes' }),
        // 8 dropped INSIDE performBatch: belongs to a different audience
        otherAudienceEvent,
        // 9 add, sent
        makeEvent({ membership: true, emails: 'add3@example.com' })
      ]

      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events,
        mapping
      })

      expect(scope.isDone()).toBe(true)

      // Only the valid events reached the API, in one request, adds first then removes.
      expect(captured.body).toEqual({
        advertiserId: ADVERTISER_ID,
        addedContactInfoList: {
          contactInfos: [
            { hashedEmails: [hash('add1@example.com')] },
            { hashedPhoneNumbers: [hash('+12125650000')] },
            { hashedEmails: [hash('add3@example.com')] }
          ],
          consent: GRANTED_CONSENT
        },
        removedContactInfoList: {
          contactInfos: [
            { hashedEmails: [hash('remove1@example.com')] },
            { hashedEmails: [hash('remove2@example.com')] }
          ],
          consent: GRANTED_CONSENT
        }
      })

      const success = (member: Record<string, unknown>) => ({
        status: 200,
        sent: { members: [member] },
        body: { success: true }
      })

      // Every index is asserted, in order, proving index alignment survives both drop points.
      expect(responses).toEqual([
        success({ hashedEmails: [hash('add1@example.com')] }),
        success({ hashedEmails: [hash('remove1@example.com')] }),
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errorreporter: 'INTEGRATIONS',
          errormessage: 'Enable Batching must be a boolean but it was a string.'
        },
        success({ hashedPhoneNumbers: [hash('+12125650000')] }),
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errorreporter: 'INTEGRATIONS',
          errormessage: expect.stringContaining('No usable contact info identifiers')
        },
        success({ hashedEmails: [hash('remove2@example.com')] }),
        {
          status: 400,
          errortype: 'INVALID_AUDIENCE_MEMBERSHIP',
          errorreporter: 'INTEGRATIONS',
          errormessage: 'Audience membership could not be resolved to a boolean'
        },
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errorreporter: 'INTEGRATIONS',
          errormessage: 'Enable Batching must be a boolean but it was a string.'
        },
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errorreporter: 'INTEGRATIONS',
          errormessage: expect.stringContaining('does not belong to the same audience')
        },
        success({ hashedEmails: [hash('add3@example.com')] })
      ])
    })
  })

  // Classic Engage audiences and Journeys V2 both carry a membership boolean at
  // properties[computation_key] on a track, or traits[computation_key] on an identify. The
  // boolean decides whether the user is added to or removed from the audience.
  describe('Journeys and Engage classic payloads', () => {
    it.each([
      ['journey_step', 'Journeys V2'],
      ['audience', 'a classic Engage audience']
    ])('adds the user when the boolean is true on %p, which is %s', async (computationClass: string) => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ computationClass, membership: true, emails: 'jane@example.com' }),
        mapping,
        useDefaultMappings: false
      })

      expect(captured.body.addedContactInfoList.contactInfos).toEqual([{ hashedEmails: [hash('jane@example.com')] }])
      expect(captured.body.removedContactInfoList).toBeUndefined()
    })

    it.each([
      ['journey_step', 'Journeys V2'],
      ['audience', 'a classic Engage audience']
    ])('removes the user when the boolean is false on %p, which is %s', async (computationClass: string) => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ computationClass, membership: false, emails: 'jane@example.com' }),
        mapping,
        useDefaultMappings: false
      })

      expect(captured.body.removedContactInfoList.contactInfos).toEqual([{ hashedEmails: [hash('jane@example.com')] }])
      expect(captured.body.addedContactInfoList).toBeUndefined()
    })

    // An identify carries the boolean on traits rather than properties.
    it('reads the boolean from traits on an identify', async () => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ type: 'identify', membership: false, emails: 'jane@example.com' }),
        mapping,
        useDefaultMappings: false
      })

      expect(captured.body.removedContactInfoList.contactInfos).toEqual([{ hashedEmails: [hash('jane@example.com')] }])
    })

    // Without the boolean there is nothing to decide add or remove on, and the legacy Journeys
    // fallback below does not apply to a classic Engage audience.
    it('fails the event when a classic Engage payload has no boolean', async () => {
      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [makeEvent({ computationClass: 'audience', membership: null, emails: 'jane@example.com' })],
        mapping
      })

      expect(responses[0].status).toBe(400)
      expect((responses[0] as unknown as { errortype: string }).errortype).toBe('INVALID_AUDIENCE_MEMBERSHIP')
    })
  })

  // A legacy Journeys payload is a journey step which carries no membership boolean at all.
  // Entering the step is itself the signal, so the user is added. Core only reads a payload
  // this way behind a feature flag, so every test here passes it.
  describe('Journeys legacy payloads', () => {
    const legacyEvent = (emails: string) => makeEvent({ computationClass: 'journey_step', membership: null, emails })

    const withFlag = { features: { [LEGACY_JOURNEYS_FLAG]: true } }

    it('adds the user when there is no membership boolean', async () => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: legacyEvent('jane@example.com'),
        mapping,
        useDefaultMappings: false,
        ...withFlag
      })

      expect(captured.body.addedContactInfoList.contactInfos).toEqual([{ hashedEmails: [hash('jane@example.com')] }])
      expect(captured.body.removedContactInfoList).toBeUndefined()
    })

    it('adds every user of a legacy batch, never removing', async () => {
      const { captured } = captureBody()

      await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [legacyEvent('one@example.com'), legacyEvent('two@example.com')],
        mapping,
        ...withFlag
      })

      expect(captured.body.addedContactInfoList.contactInfos).toEqual([
        { hashedEmails: [hash('one@example.com')] },
        { hashedEmails: [hash('two@example.com')] }
      ])
      expect(captured.body.removedContactInfoList).toBeUndefined()
    })

    // The flag does not make a journey step always mean an add. Core reads a membership
    // boolean first whenever there is one, so a journey step which carries false still removes
    // the user. The fallback only applies when there is no boolean to read, which is what a
    // genuine legacy payload looks like.
    it('still removes the user when a journey step carries false', async () => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ computationClass: 'journey_step', membership: false, emails: 'jane@example.com' }),
        mapping,
        useDefaultMappings: false,
        ...withFlag
      })

      expect(captured.body.removedContactInfoList.contactInfos).toEqual([{ hashedEmails: [hash('jane@example.com')] }])
      expect(captured.body.addedContactInfoList).toBeUndefined()
    })

    it('adds the user when a journey step carries true', async () => {
      const { captured } = captureBody()

      await testDestination.testAction('syncAudience', {
        event: makeEvent({ computationClass: 'journey_step', membership: true, emails: 'jane@example.com' }),
        mapping,
        useDefaultMappings: false,
        ...withFlag
      })

      expect(captured.body.addedContactInfoList.contactInfos).toEqual([{ hashedEmails: [hash('jane@example.com')] }])
      expect(captured.body.removedContactInfoList).toBeUndefined()
    })

    // Without the flag core cannot resolve the membership, so the event fails rather than
    // being assumed to be an add.
    it('fails the event when the flag is off', async () => {
      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [legacyEvent('jane@example.com')],
        mapping
      })

      expect(responses[0].status).toBe(400)
      expect((responses[0] as unknown as { errortype: string }).errortype).toBe('INVALID_AUDIENCE_MEMBERSHIP')
    })

    // The fallback is specific to a journey step. A classic Engage audience with no boolean is
    // still a failure even with the flag on.
    it('does not apply the fallback to a classic Engage audience', async () => {
      const responses = await testDestination.executeBatch('syncAudience', {
        settings: {},
        events: [makeEvent({ computationClass: 'audience', membership: null, emails: 'jane@example.com' })],
        mapping,
        ...withFlag
      })

      expect(responses[0].status).toBe(400)
      expect((responses[0] as unknown as { errortype: string }).errortype).toBe('INVALID_AUDIENCE_MEMBERSHIP')
    })
  })
})
