import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../versioning-info'
import { BASE_URL, BASE_URL_STAGING, BASE_URL_PRODUCTION } from '../constants'

const testDestination = createTestIntegration(Destination)

describe('Memora Destination', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('Authentication', () => {
    it('should send basic auth credentials in testAuthentication', async () => {
      nock(BASE_URL)
        .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=1`)
        .basicAuth({ user: 'test-api-key', pass: 'test-api-secret' })
        .reply(200, { services: [] })

      const settings = {
        username: 'test-api-key',
        password: 'test-api-secret'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should reject invalid credentials with 401', async () => {
      nock(BASE_URL).get(`/${API_VERSION}/ControlPlane/Stores?pageSize=1`).reply(401, { message: 'Unauthorized' })

      const settings = {
        username: 'invalid-key',
        password: 'invalid-secret'
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })

    it('should reject invalid credentials with 403', async () => {
      nock(BASE_URL).get(`/${API_VERSION}/ControlPlane/Stores?pageSize=1`).reply(403, { message: 'Forbidden' })

      const settings = {
        username: 'test-api-key',
        password: 'wrong-secret'
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })

    it('should handle network errors during authentication', async () => {
      nock(BASE_URL)
        .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=1`)
        .replyWithError({ message: 'Network error', code: 'ECONNREFUSED' })

      const settings = {
        username: 'test-api-key',
        password: 'test-api-secret'
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })

    it('should handle 500 errors during authentication', async () => {
      nock(BASE_URL)
        .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=1`)
        .reply(500, { message: 'Internal server error' })

      const settings = {
        username: 'test-api-key',
        password: 'test-api-secret'
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })

    it('should handle 404 errors during authentication', async () => {
      nock(BASE_URL).get(`/${API_VERSION}/ControlPlane/Stores?pageSize=1`).reply(404, { message: 'Not found' })

      const settings = {
        username: 'test-api-key',
        password: 'test-api-secret'
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })

    it('should use staging base URL when ACTIONS_MEMORA_ENV is not set to production', async () => {
      const originalEnv = process.env.ACTIONS_MEMORA_ENV
      delete process.env.ACTIONS_MEMORA_ENV

      nock(BASE_URL_STAGING)
        .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=1`)
        .basicAuth({ user: 'test-api-key', pass: 'test-api-secret' })
        .reply(200, { stores: [] })

      const settings = {
        username: 'test-api-key',
        password: 'test-api-secret'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()

      if (originalEnv !== undefined) {
        process.env.ACTIONS_MEMORA_ENV = originalEnv
      }
    })

    it('should use production base URL when ACTIONS_MEMORA_ENV is set to production', async () => {
      const originalEnv = process.env.ACTIONS_MEMORA_ENV
      process.env.ACTIONS_MEMORA_ENV = 'production'

      nock(BASE_URL_PRODUCTION)
        .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=1`)
        .basicAuth({ user: 'test-api-key', pass: 'test-api-secret' })
        .reply(200, { stores: [] })

      const settings = {
        username: 'test-api-key',
        password: 'test-api-secret'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()

      if (originalEnv !== undefined) {
        process.env.ACTIONS_MEMORA_ENV = originalEnv
      } else {
        delete process.env.ACTIONS_MEMORA_ENV
      }
    })
  })

  describe('extendRequest', () => {
    it('should not be defined (auth is manually added per request)', () => {
      expect(Destination.extendRequest).toBeUndefined()
    })
  })
})
