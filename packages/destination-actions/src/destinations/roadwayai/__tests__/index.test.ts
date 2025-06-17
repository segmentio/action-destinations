import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Roadway AI', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://app.roadwayai.com').post('/api/v1/segment/validate-credentials').reply(200, { success: true })

      const settings = {
        apiKey: 'test-api-key'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should throw error when authentication fails', async () => {
      nock('https://app.roadwayai.com')
        .post('/api/v1/segment/validate-credentials')
        .reply(401, { error: 'Invalid API key' })

      const settings = {
        apiKey: 'invalid-api-key'
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })
  })
})
