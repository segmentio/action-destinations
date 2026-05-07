import nock from 'nock'
import { createTestIntegration, RetryableError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const AUTH_HOST = 'https://auth.example.com'
const AUTH_PATH = '/oauth/token'
const API_HOST = 'https://api.example.com'
const API_BASE_PATH = '/api/'

const SETTINGS = {
  apiAuthEndpoint: `${AUTH_HOST}${AUTH_PATH}`,
  apiBaseUrl: `${API_HOST}${API_BASE_PATH}`,
  apiClientId: 'testclient',
  apiClientSecret: 'supersecret'
}

const TESTPAYLOAD = {
  key_field: '3',
  key_value: 'tester@emarsys.com',
  write_field: {
    '2': 'Mustermann'
  }
}

function mockAuth() {
  nock(AUTH_HOST).post(AUTH_PATH).reply(200, { token_type: 'Bearer', access_token: 'test-token', expires_in: 3600 })
}

beforeEach(() => {
  nock.cleanAll()
})

describe('Emarsys.upsertContact', () => {
  const regex = new RegExp(`${API_BASE_PATH}contact/`, 'g')

  it('should get a replyCode=0', async () => {
    mockAuth()
    nock(`${API_HOST}`)
      .put(regex)
      .reply(
        200,
        `{
      "replyCode": 0,
      "replyText": "OK",
      "data": {
        "id": "766939632"
      }
    }`
      )
    await expect(
      testDestination.testAction('upsertContact', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).resolves.not.toThrowError()
  })

  it('should get an error because of missing key value', async () => {
    mockAuth()
    nock(`${API_HOST}`)
      .put(regex)
      .reply(
        200,
        `{
      "replyCode": 0,
      "replyText": "OK",
      "data": {
        "inserted_contacts": 0,
        "errors": {
          "": {
            "2005": "No value provided for key field: 3"
          }
        }
      }
    }`
      )
    const MODIFIED_PAYLOAD = { ...TESTPAYLOAD }
    MODIFIED_PAYLOAD.key_value = ''
    await expect(
      testDestination.testAction('upsertContact', {
        mapping: MODIFIED_PAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError()
  })

  it('should throw an RetryableError if the API responds with a server error', async () => {
    mockAuth()
    nock(`${API_HOST}`).put(regex).reply(500, 'Internal server error')
    await expect(
      testDestination.testAction('upsertContact', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })

  it('should throw an RetryableError if the rate limit was reached', async () => {
    mockAuth()
    nock(`${API_HOST}`).put(regex).reply(429, 'Too many requests')
    await expect(
      testDestination.testAction('upsertContact', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })
})
