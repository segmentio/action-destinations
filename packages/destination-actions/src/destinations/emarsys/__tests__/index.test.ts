import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import destination from '../index'
import { tokenCache } from '../emarsys-helper'

const testDestination = createTestIntegration(destination)

const AUTH_HOST = 'https://auth.example.com'
const AUTH_PATH = '/oauth/token'
const API_HOST = 'https://api.example.com'
const API_BASE_PATH = '/api/'

beforeEach(() => {
  nock.cleanAll()
  tokenCache.clear()
})

describe('Emarsys', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(AUTH_HOST)
        .persist()
        .post(AUTH_PATH)
        .reply(200, { token_type: 'Bearer', access_token: 'test-token', expires_in: 3600 })

      nock(API_HOST)
        .persist()
        .get(/.*/)
        .reply(200, { replyCode: 0, data: { id: 123 } })

      nock(API_HOST)
        .persist()
        .post(/.*/)
        .reply(200, { replyCode: 0, data: { id: 123 } })

      const authData = {
        auth_type: 'new',
        apiAuthEndpoint: `${AUTH_HOST}${AUTH_PATH}`,
        apiBaseUrl: `${API_HOST}${API_BASE_PATH}`,
        apiClientId: 'testclient',
        apiClientSecret: 'supersecret'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
