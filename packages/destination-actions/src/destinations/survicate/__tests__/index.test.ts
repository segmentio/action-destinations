import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Survicate Cloud Mode', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('testAuthentication', () => {
    const authData = {
      apiKey: 'test_api_key'
    }

    it('should validate authentication inputs', async () => {
      nock('https://integrations.survicate.com').get('/endpoint/segment/check').reply(200, {})

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock('https://integrations.survicate.com').get('/endpoint/segment/check').reply(401, {})

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
