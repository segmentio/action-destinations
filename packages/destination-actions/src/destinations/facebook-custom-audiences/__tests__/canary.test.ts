import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { BASE_URL, FACEBOOK_CUSTOM_AUDIENCE_FLAGON } from '../constants'
import { SCHEMA_PROPERTIES } from '../sync/constants'
import Destination from '../index'


// Override CANARY_API_VERSION with a distinct test value so we can verify
// that requests are routed to the correct URL. The real constant stays at
// its production value; only this test module sees the override.
// The literal must be inlined in the factory because jest.mock is hoisted
// before any variable declarations.
jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  CANARY_API_VERSION: 'v25.0'
}))

const TEST_CANARY_API_VERSION = 'v25.0'
const TEST_API_VERSION = 'v24.0'
const testDestination = createTestIntegration(Destination)
const auth = { accessToken: '123', refreshToken: '321' }
const settings = { retlAdAccountId: '123' }
const adAccountId = '1500000000000000'
const audienceId = '900'

// 13 empty strings for unmapped PII fields
const EMPTY_TAIL = ['', '', '', '', '', '', '', '', '', '', '', '', '']

const baseMapping = {
  __segment_internal_sync_mode: 'upsert',
  externalId: { '@path': '$.userId' },
  email: { '@path': '$.properties.email' },
  retlOnMappingSave: {
    inputs: {},
    outputs: {
      audienceName: 'test-audience',
      audienceId
    }
  },
  enable_batching: true,
  batch_size: 10000
}

describe('Facebook Custom Audiences - canary API version', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('sync action (upsert)', () => {
    const events = [createTestEvent({ userId: 'user-1', properties: { email: 'user1@example.com' } })]

    const expectedBody = {
      payload: {
        schema: SCHEMA_PROPERTIES,
        data: [['user-1', 'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', ...EMPTY_TAIL]]
      }
    }

    const facebookResponse = { audience_id: audienceId, num_received: 1, num_invalid_entries: 0, invalid_entry_samples: {} }

    it('sends payload to the standard API_VERSION URL when the canary flag is off', async () => {
      nock(`${BASE_URL}/${TEST_API_VERSION}`)
        .post(`/${audienceId}/users`, expectedBody)
        .reply(200, facebookResponse)

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings,
        auth,
        mapping: baseMapping,
        features: { [FACEBOOK_CUSTOM_AUDIENCE_FLAGON]: false }
      })

      expect(responses[0].status).toBe(200)
    })

    it('sends payload to the CANARY_API_VERSION URL when the canary flag is on', async () => {
      nock(`${BASE_URL}/${TEST_CANARY_API_VERSION}`)
        .post(`/${audienceId}/users`, expectedBody)
        .reply(200, facebookResponse)

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings,
        auth,
        mapping: baseMapping,
        features: { [FACEBOOK_CUSTOM_AUDIENCE_FLAGON]: true }
      })

      expect(responses[0].status).toBe(200)
    })

    it('does NOT send to the canary URL when the flag is off', async () => {
      // Only mock the standard version - if the code incorrectly hits the
      // canary URL, nock will throw a connection error and the test will fail.
      nock(`${BASE_URL}/${TEST_API_VERSION}`)
        .post(`/${audienceId}/users`, expectedBody)
        .reply(200, facebookResponse)

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings,
        auth,
        mapping: baseMapping,
        features: {}
      })

      expect(responses[0].status).toBe(200)
    })
  })

  describe('createAudience', () => {
    it('sends the create request to the standard API_VERSION URL when the canary flag is off', async () => {
      nock(`${BASE_URL}/${TEST_API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(200, { id: '88888888888888888' })

      const result = await testDestination.createAudience({
        settings,
        audienceName: 'Test Audience',
        audienceSettings: { engageAdAccountId: adAccountId, audienceDescription: 'Test' },
        features: { [FACEBOOK_CUSTOM_AUDIENCE_FLAGON]: false }
      })

      expect(result).toEqual({ externalId: '88888888888888888' })
    })

    it('sends the create request to the CANARY_API_VERSION URL when the canary flag is on', async () => {
      nock(`${BASE_URL}/${TEST_CANARY_API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(200, { id: '88888888888888888' })

      const result = await testDestination.createAudience({
        settings,
        audienceName: 'Test Audience',
        audienceSettings: { engageAdAccountId: adAccountId, audienceDescription: 'Test' },
        features: { [FACEBOOK_CUSTOM_AUDIENCE_FLAGON]: true }
      })

      expect(result).toEqual({ externalId: '88888888888888888' })
    })
  })

  describe('getAudience', () => {
    it('sends the get request to the standard API_VERSION URL when the canary flag is off', async () => {
      nock(`${BASE_URL}/${TEST_API_VERSION}`)
        .get(`/${audienceId}`)
        .reply(200, { id: audienceId, name: 'Test Audience' })

      const result = await testDestination.getAudience({
        externalId: audienceId,
        settings,
        features: { [FACEBOOK_CUSTOM_AUDIENCE_FLAGON]: false }
      })

      expect(result).toEqual({ externalId: audienceId })
    })

    it('sends the get request to the CANARY_API_VERSION URL when the canary flag is on', async () => {
      nock(`${BASE_URL}/${TEST_CANARY_API_VERSION}`)
        .get(`/${audienceId}`)
        .reply(200, { id: audienceId, name: 'Test Audience' })

      const result = await testDestination.getAudience({
        externalId: audienceId,
        settings,
        features: { [FACEBOOK_CUSTOM_AUDIENCE_FLAGON]: true }
      })

      expect(result).toEqual({ externalId: audienceId })
    })
  })
})
