import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Cordial', () => {
  describe('testAuthentication', () => {
    it('should authenticate with Cordial API key', async () => {
      nock('https://integrations.cordial.io/segment').post('').reply(400, { message: 'Incompatible type'})

      const settings = {
        apiKey: 'cordialApiKey',
        endpoint: 'https://integrations.cordial.io/segment'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should throw error on invalid Cordial API key', async () => {
      nock('https://integrations.cordial.io/segment').post('').reply(401, { error: 'Access Denied: Authentication Failure'})

      const settings = {
        apiKey: 'cordialApiKey',
        endpoint: 'https://integrations.cordial.io/segment'
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError('Credentials are invalid: 401 {"error":"Access Denied: Authentication Failure"}')
    })
  })
})
