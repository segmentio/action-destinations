import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../constants'
import { TIKTOK_AUDIENCES_API_VERSION } from '../../versioning-info'
import syncAudience from '../../syncAudience'

const testDestination = createTestIntegration(Destination)

const SEGMENT_MAPPING_URL = `${BASE_URL}${TIKTOK_AUDIENCES_API_VERSION}/segment/mapping/`

const auth = {
  accessToken: 'test',
  refreshToken: 'test'
}

const EXTERNAL_AUDIENCE_ID = '12345'
const ADVERTISER_ID = '123'
const ADVERTISING_ID = '4242'
const COMPUTATION_KEY = 'test_audience_key'

const defaultMapping = Object.fromEntries(
  Object.entries(syncAudience.fields).map(([key, field]) => [key, field.default])
)

const SUCCESS_RESPONSE = { code: 0, message: 'OK', request_id: 'test-request-id' }
const ERROR_RESPONSE = { code: 40002, message: 'Parameter error: invalid audience ID', request_id: 'test-request-id' }

function createAudienceEvent(membership: boolean, overrides: Record<string, unknown> = {}) {
  return createTestEvent({
    event: 'Audience Entered',
    type: 'track',
    properties: {
      [COMPUTATION_KEY]: membership
    },
    context: {
      device: {
        advertisingId: ADVERTISING_ID
      },
      traits: {
        email: 'testing@testing.com',
        phone: '1234567890'
      },
      personas: {
        computation_class: 'audience',
        computation_key: COMPUTATION_KEY,
        audience_settings: {
          advertiserId: ADVERTISER_ID
        },
        external_audience_id: EXTERNAL_AUDIENCE_ID
      }
    },
    ...overrides
  })
}

// Pre-computed hashes for test data
// sha256('testingtestingcom') - email after normalization (dots removed, lowercase)
const HASHED_EMAIL = '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
// sha256('1234567890')
const HASHED_PHONE = 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646'
// sha256('4242')
const HASHED_ADVERTISING_ID = '0315b4020af3eccab7706679580ac87a710d82970733b8719e70af9b57e7b9e6'

describe('TiktokAudiences.syncAudience', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('single payload (perform)', () => {
    it('should add a user to the audience when membership is true', async () => {
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/, (body) => body.action === 'add')
        .reply(200, SUCCESS_RESPONSE)

      const event = createAudienceEvent(true)
      const responses = await testDestination.testAction('syncAudience', {
        auth,
        event,
        settings: {},
        useDefaultMappings: true,
        mapping: {}
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)

      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.action).toBe('add')
      expect(requestBody.advertiser_ids).toEqual([ADVERTISER_ID])
      expect(requestBody.id_schema).toEqual(['EMAIL_SHA256', 'PHONE_SHA256', 'IDFA_SHA256'])
      expect(requestBody.batch_data).toEqual([
        [
          { id: HASHED_EMAIL, audience_ids: [EXTERNAL_AUDIENCE_ID] },
          { id: HASHED_PHONE, audience_ids: [EXTERNAL_AUDIENCE_ID] },
          { id: HASHED_ADVERTISING_ID, audience_ids: [EXTERNAL_AUDIENCE_ID] }
        ]
      ])
    })

    it('should remove a user from the audience when membership is false', async () => {
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/, (body) => body.action === 'delete')
        .reply(200, SUCCESS_RESPONSE)

      const event = createAudienceEvent(false)
      const responses = await testDestination.testAction('syncAudience', {
        auth,
        event,
        settings: {},
        useDefaultMappings: true,
        mapping: {}
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)

      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.action).toBe('delete')
    })

    it('should send only email when only send_email is true', async () => {
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/)
        .reply(200, SUCCESS_RESPONSE)

      const event = createAudienceEvent(true)
      const responses = await testDestination.testAction('syncAudience', {
        auth,
        event,
        settings: {},
        useDefaultMappings: true,
        mapping: {
          send_phone: false,
          send_advertising_id: false
        }
      })

      expect(responses.length).toBe(1)
      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.id_schema).toEqual(['EMAIL_SHA256'])
      expect(requestBody.batch_data).toEqual([
        [{ id: HASHED_EMAIL, audience_ids: [EXTERNAL_AUDIENCE_ID] }]
      ])
    })

    it('should send only phone when only send_phone is true', async () => {
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/)
        .reply(200, SUCCESS_RESPONSE)

      const event = createAudienceEvent(true)
      const responses = await testDestination.testAction('syncAudience', {
        auth,
        event,
        settings: {},
        useDefaultMappings: true,
        mapping: {
          send_email: false,
          send_advertising_id: false
        }
      })

      expect(responses.length).toBe(1)
      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.id_schema).toEqual(['PHONE_SHA256'])
      expect(requestBody.batch_data).toEqual([
        [{ id: HASHED_PHONE, audience_ids: [EXTERNAL_AUDIENCE_ID] }]
      ])
    })

    it('should normalize and hash emails correctly', async () => {
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/)
        .reply(200, SUCCESS_RESPONSE)

      const event = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: { [COMPUTATION_KEY]: true },
        context: {
          traits: {
            email: 'Test.User+tag@Testing.com'
          },
          personas: {
            computation_class: 'audience',
            computation_key: COMPUTATION_KEY,
            audience_settings: { advertiserId: ADVERTISER_ID },
            external_audience_id: EXTERNAL_AUDIENCE_ID
          }
        }
      })

      const responses = await testDestination.testAction('syncAudience', {
        auth,
        event,
        settings: {},
        useDefaultMappings: true,
        mapping: {
          send_phone: false,
          send_advertising_id: false
        }
      })

      expect(responses.length).toBe(1)
      const requestBody = JSON.parse(responses[0].options.body as string)
      // 'Test.User+tag@Testing.com' -> normalized to 'testuser@testingcom' -> hashed
      // Normalization: remove dots before @, remove +tag, lowercase
      expect(requestBody.batch_data[0][0].id).toBeDefined()
      expect(requestBody.batch_data[0][0].id).toHaveLength(64) // SHA256 hex
    })

    it('should not double-hash a pre-hashed email', async () => {
      const preHashedEmail = '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/)
        .reply(200, SUCCESS_RESPONSE)

      const event = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: { [COMPUTATION_KEY]: true },
        context: {
          traits: { email: preHashedEmail },
          personas: {
            computation_class: 'audience',
            computation_key: COMPUTATION_KEY,
            audience_settings: { advertiserId: ADVERTISER_ID },
            external_audience_id: EXTERNAL_AUDIENCE_ID
          }
        }
      })

      const responses = await testDestination.testAction('syncAudience', {
        auth,
        event,
        settings: {},
        useDefaultMappings: true,
        mapping: {
          send_phone: false,
          send_advertising_id: false
        }
      })

      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.batch_data[0][0].id).toBe(preHashedEmail)
    })

    it('should not double-hash a pre-hashed phone', async () => {
      const preHashedPhone = 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646'
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/)
        .reply(200, SUCCESS_RESPONSE)

      const event = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: { [COMPUTATION_KEY]: true },
        context: {
          traits: { phone: preHashedPhone },
          personas: {
            computation_class: 'audience',
            computation_key: COMPUTATION_KEY,
            audience_settings: { advertiserId: ADVERTISER_ID },
            external_audience_id: EXTERNAL_AUDIENCE_ID
          }
        }
      })

      const responses = await testDestination.testAction('syncAudience', {
        auth,
        event,
        settings: {},
        useDefaultMappings: true,
        mapping: {
          send_email: false,
          send_advertising_id: false
        }
      })

      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.batch_data[0][0].id).toBe(preHashedPhone)
    })

    it('should throw when all send flags are false', async () => {
      const event = createAudienceEvent(true)

      await expect(
        testDestination.testAction('syncAudience', {
          auth,
          event,
          settings: {},
          useDefaultMappings: true,
          mapping: {
            send_email: false,
            send_phone: false,
            send_advertising_id: false
          }
        })
      ).rejects.toThrow('At least one of `Send Email`, `Send Phone` or `Send Advertising ID` must be set to `true`.')
    })

    it('should throw when enabled identifiers have no values', async () => {
      const event = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: { [COMPUTATION_KEY]: true },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: COMPUTATION_KEY,
            audience_settings: { advertiserId: ADVERTISER_ID },
            external_audience_id: EXTERNAL_AUDIENCE_ID
          }
        }
      })

      await expect(
        testDestination.testAction('syncAudience', {
          auth,
          event,
          settings: {},
          useDefaultMappings: true,
          mapping: {
            send_email: true,
            send_phone: false,
            send_advertising_id: false
          }
        })
      ).rejects.toThrow('At least one enabled identifier (Email, Phone, or Advertising ID) must have a value.')
    })

    it('should throw when audienceSettings are missing', async () => {
      const event = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: { [COMPUTATION_KEY]: true },
        context: {
          traits: { email: 'testing@testing.com' },
          personas: {
            computation_class: 'audience',
            computation_key: COMPUTATION_KEY,
            external_audience_id: EXTERNAL_AUDIENCE_ID
          }
        }
      })

      await expect(
        testDestination.testAction('syncAudience', {
          auth,
          event,
          settings: {},
          useDefaultMappings: true,
          mapping: {}
        })
      ).rejects.toThrow('Bad Request: no audienceSettings found.')
    })

    it('should throw when TikTok returns HTTP 200 with error code', async () => {
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/)
        .reply(200, ERROR_RESPONSE)

      const event = createAudienceEvent(true)

      await expect(
        testDestination.testAction('syncAudience', {
          auth,
          event,
          settings: {},
          useDefaultMappings: true,
          mapping: {}
        })
      ).rejects.toThrow('Parameter error: invalid audience ID')
    })

    it('should throw when TikTok returns HTTP 400', async () => {
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/)
        .reply(400, ERROR_RESPONSE)

      const event = createAudienceEvent(true)

      await expect(
        testDestination.testAction('syncAudience', {
          auth,
          event,
          settings: {},
          useDefaultMappings: true,
          mapping: {}
        })
      ).rejects.toThrow('Parameter error: invalid audience ID')
    })
  })

  describe('batch (performBatch)', () => {
    it('should send adds and deletes in separate API calls for a mixed batch', async () => {
      const addNock = nock(SEGMENT_MAPPING_URL)
        .post(/.*/, (body) => body.action === 'add')
        .reply(200, SUCCESS_RESPONSE)

      const deleteNock = nock(SEGMENT_MAPPING_URL)
        .post(/.*/, (body) => body.action === 'delete')
        .reply(200, SUCCESS_RESPONSE)

      const events = [
        createAudienceEvent(true) as SegmentEvent,
        createAudienceEvent(false) as SegmentEvent
      ]

      const responses = await testDestination.executeBatch('syncAudience', {
        events,
        settings: {},
        mapping: defaultMapping,
        auth
      })

      expect(addNock.isDone()).toBe(true)
      expect(deleteNock.isDone()).toBe(true)
      expect(responses.length).toBe(2)
    })

    it('should send a single add call when all memberships are true', async () => {
      const addNock = nock(SEGMENT_MAPPING_URL)
        .post(/.*/, (body) => body.action === 'add')
        .reply(200, SUCCESS_RESPONSE)

      const events = [
        createAudienceEvent(true) as SegmentEvent,
        createAudienceEvent(true) as SegmentEvent
      ]

      await testDestination.executeBatch('syncAudience', {
        events,
        settings: {},
        mapping: defaultMapping,
        auth
      })

      expect(addNock.isDone()).toBe(true)
    })

    it('should send a single delete call when all memberships are false', async () => {
      const deleteNock = nock(SEGMENT_MAPPING_URL)
        .post(/.*/, (body) => body.action === 'delete')
        .reply(200, SUCCESS_RESPONSE)

      const events = [
        createAudienceEvent(false) as SegmentEvent,
        createAudienceEvent(false) as SegmentEvent
      ]

      await testDestination.executeBatch('syncAudience', {
        events,
        settings: {},
        mapping: defaultMapping,
        auth
      })

      expect(deleteNock.isDone()).toBe(true)
    })

    it('should record success for all payloads when TikTok returns code 0', async () => {
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/)
        .reply(200, SUCCESS_RESPONSE)

      const events = [
        createAudienceEvent(true) as SegmentEvent,
        createAudienceEvent(true) as SegmentEvent
      ]

      const responses = await testDestination.executeBatch('syncAudience', {
        events,
        settings: {},
        mapping: defaultMapping,
        auth
      })

      expect(responses.length).toBe(2)
      const successItems = responses.filter((item: { status: number }) => item.status === 200)
      expect(successItems.length).toBe(2)
    })

    it('should record errors for all payloads when TikTok returns HTTP 200 with error code', async () => {
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/)
        .reply(200, ERROR_RESPONSE)

      const events = [
        createAudienceEvent(true) as SegmentEvent,
        createAudienceEvent(true) as SegmentEvent
      ]

      const responses = await testDestination.executeBatch('syncAudience', {
        events,
        settings: {},
        mapping: defaultMapping,
        auth
      })

      expect(responses.length).toBe(2)
      const errorItems = responses.filter((item: { status: number }) => item.status >= 400)
      expect(errorItems.length).toBe(2)
      expect(errorItems[0].errormessage).toBe('Parameter error: invalid audience ID')
    })

    it('should record errors for all payloads when TikTok returns HTTP 400', async () => {
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/)
        .reply(400, ERROR_RESPONSE)

      const events = [
        createAudienceEvent(true) as SegmentEvent,
        createAudienceEvent(true) as SegmentEvent
      ]

      const responses = await testDestination.executeBatch('syncAudience', {
        events,
        settings: {},
        mapping: defaultMapping,
        auth
      })

      expect(responses.length).toBe(2)
      const errorItems = responses.filter((item: { status: number }) => item.status >= 400)
      expect(errorItems.length).toBe(2)
    })

    it('should record validation errors per payload while succeeding for valid ones', async () => {
      nock(SEGMENT_MAPPING_URL)
        .post(/.*/)
        .reply(200, SUCCESS_RESPONSE)

      const validEvent = createAudienceEvent(true) as SegmentEvent
      const invalidEvent = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: { [COMPUTATION_KEY]: true },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: COMPUTATION_KEY,
            audience_settings: { advertiserId: ADVERTISER_ID },
            external_audience_id: EXTERNAL_AUDIENCE_ID
          }
        }
      }) as SegmentEvent

      const events = [validEvent, invalidEvent]

      const responses = await testDestination.executeBatch('syncAudience', {
        events,
        settings: {},
        mapping: { ...defaultMapping, send_phone: false, send_advertising_id: false },
        auth
      })

      expect(responses.length).toBe(2)
      const successItems = responses.filter((item: { status: number }) => item.status === 200)
      const errorItems = responses.filter((item: { status: number }) => item.status >= 400)
      expect(successItems.length).toBe(1)
      expect(errorItems.length).toBe(1)
      expect(errorItems[0].errormessage).toBe(
        'At least one enabled identifier (Email, Phone, or Advertising ID) must have a value.'
      )
    })
  })
})
