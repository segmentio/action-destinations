import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

import { API_URL } from '../config'

const testDestination = createTestIntegration(Definition)

describe('Mantle', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(API_URL).get('/app').reply(200, {})

      const authData = {
        appId: 'fake-app-id',
        apiKey: 'fake-api-key'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
    it('should fail on invalid authentication inputs', async () => {
      nock(API_URL).get('/app').reply(401, {})

      const authData = {
        appId: 'fake-app-id',
        apiKey: ''
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
