import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { BaseAlgoliaInsightsURL } from '../algolia-insight-api'

const testDestination = createTestIntegration(Definition)

describe('Algolia Insights', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(BaseAlgoliaInsightsURL).post('*').reply(200, {})
      const authData = {
        appId: 'algolia-application-id',
        apiKey: 'algolia-api-key'
      }
      // there is no testAuthentication function for this destination so this just validates the authData schema
      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
