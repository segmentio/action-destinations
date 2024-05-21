import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Trubrics', () => {
  describe('testAuthentication', () => {
    it.skip('should validate authentication inputs', async () => {
      const authData = {
        apiKey: 'testId',
        url: 'api.trubrics.com'
      }
      nock(`https://${authData.url}`).post(`/publish_event?project_api_key=${authData.apiKey}`).reply(200, {})
      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
