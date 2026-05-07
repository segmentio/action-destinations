import nock from 'nock'
import { APIError, createTestIntegration, RetryableError } from '@segment/actions-core'
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
  eventid: 100000257,
  key_field: '3',
  key_value: 'tester@emarsys.com',
  event_payload: {
    surname: 'Mustermann'
  }
}

const regex = new RegExp(`${API_BASE_PATH}event/[0-9]+/trigger$`, 'g')

function mockAuth() {
  nock(AUTH_HOST).post(AUTH_PATH).reply(200, { token_type: 'Bearer', access_token: 'test-token', expires_in: 3600 })
}

beforeEach(() => {
  nock.cleanAll()
})

describe('Emarsys.triggerEvent', () => {
  it('should get a replyCode=0', async () => {
    mockAuth()
    nock(`${API_HOST}`)
      .post(regex)
      .reply(
        200,
        `{
      "replyCode": 0,
      "replyText": "OK",
      "data": {
        "connectedTo": {
          "email": false,
          "acProgram": false,
          "interactionsProgram": false
        }
      }
    }`
      )
    await expect(
      testDestination.testAction('triggerEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).resolves.not.toThrowError()
  })

  it('should throw an error because the value in key_field was not found', async () => {
    mockAuth()
    nock(`${API_HOST}`)
      .post(regex)
      .reply(
        400,
        `{
        "replyCode": 2008,
        "replyText": "No contact found with the external id: 3 - a",
        "data": ""
      }
    `
      )
    await expect(
      testDestination.testAction('triggerEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(APIError)
  })

  it('should throw an RetryableError if the API responds with a server error', async () => {
    mockAuth()
    nock(`${API_HOST}`).post(regex).reply(500, 'Internal server error')
    await expect(
      testDestination.testAction('triggerEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })

  it('should throw an RetryableError if the rate limit was reached', async () => {
    mockAuth()
    nock(`${API_HOST}`).post(regex).reply(429, 'Too many requests')
    await expect(
      testDestination.testAction('triggerEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })
})
