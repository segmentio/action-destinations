import nock from 'nock'
import { APIError, createTestIntegration, RetryableError } from '@segment/actions-core'
import Destination from '../../index'
import { tokenCache } from '../../emarsys-helper'

const testDestination = createTestIntegration(Destination)

const AUTH_HOST = 'https://auth.example.com'
const AUTH_PATH = '/oauth/token'
const API_HOST = 'https://api.example.com'
const API_BASE_PATH = '/api/v3/'

const SETTINGS = {
  auth_type: 'new',
  apiAuthEndpoint: `${AUTH_HOST}${AUTH_PATH}`,
  apiBaseUrl: `${API_HOST}${API_BASE_PATH}`,
  apiClientId: 'testclient',
  apiClientSecret: 'supersecret'
}

const TESTPAYLOAD = {
  integrationId: 'my-integration-id',
  eventConfigurationId: 'my-event-config-id',
  event_payload: {
    name: 'John Doe',
    email: 'john.doe@example.com'
  }
}

const regex = new RegExp(`/api/engagementevent/v1/integrations/[a-z0-9-]+/eventConfigurations/[a-z0-9-]+/events$`)

function mockAuth() {
  nock(AUTH_HOST).post(AUTH_PATH).reply(200, { token_type: 'Bearer', access_token: 'test-token', expires_in: 3600 })
}

beforeEach(() => {
  nock.cleanAll()
  tokenCache.clear()
})

describe('Emarsys.triggerEngagementEvent', () => {
  it('should succeed with a 200 response', async () => {
    mockAuth()
    nock(API_HOST).post(regex).reply(200, {})
    await expect(
      testDestination.testAction('triggerEngagementEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).resolves.not.toThrowError()
  })

  it('should succeed with a 202 response', async () => {
    mockAuth()
    nock(API_HOST).post(regex).reply(202, {})
    await expect(
      testDestination.testAction('triggerEngagementEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).resolves.not.toThrowError()
  })

  it('should throw an APIError on 400 response', async () => {
    mockAuth()
    nock(API_HOST).post(regex).reply(400, {})
    await expect(
      testDestination.testAction('triggerEngagementEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(APIError)
  })

  it('should throw an APIError on 403 response', async () => {
    mockAuth()
    nock(API_HOST).post(regex).reply(403, {})
    await expect(
      testDestination.testAction('triggerEngagementEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(APIError)
  })

  it('should throw an APIError on 422 response with error message', async () => {
    mockAuth()
    nock(API_HOST)
      .post(regex)
      .reply(422, JSON.stringify({ error: { message: 'Invalid payload schema' } }), {
        'Content-Type': 'application/json'
      })
    await expect(
      testDestination.testAction('triggerEngagementEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(APIError)
  })

  it('should throw a RetryableError if the rate limit was reached (429)', async () => {
    mockAuth()
    nock(API_HOST).post(regex).reply(429, 'Too many requests')
    await expect(
      testDestination.testAction('triggerEngagementEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })

  it('should throw a RetryableError on a 500 server error', async () => {
    mockAuth()
    nock(API_HOST).post(regex).reply(500, 'Internal server error')
    await expect(
      testDestination.testAction('triggerEngagementEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })

  it('should sanitize integrationId and eventConfigurationId by stripping non-alphanumeric characters', async () => {
    mockAuth()
    // The regex matches a-z0-9- only, special chars should be stripped
    nock(API_HOST).post(regex).reply(200, {})
    await expect(
      testDestination.testAction('triggerEngagementEvent', {
        mapping: {
          ...TESTPAYLOAD,
          integrationId: 'my-integration-id!!!',
          eventConfigurationId: 'my-event-config-id###'
        },
        settings: SETTINGS
      })
    ).resolves.not.toThrowError()
  })

  it('should work without an event_payload', async () => {
    mockAuth()
    nock(API_HOST).post(regex).reply(200, {})
    await expect(
      testDestination.testAction('triggerEngagementEvent', {
        mapping: {
          integrationId: TESTPAYLOAD.integrationId,
          eventConfigurationId: TESTPAYLOAD.eventConfigurationId
        },
        settings: SETTINGS
      })
    ).resolves.not.toThrowError()
  })
})
