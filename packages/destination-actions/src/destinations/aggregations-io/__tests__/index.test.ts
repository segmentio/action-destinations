import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)
const fakeApiKey = 'super-secret-key'
const fakeIngestId = 'abc456'
describe('Aggregations Io', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://app.aggregations.io')
        .get(`/api/v1/organization/ping-w?ingest_id=${fakeIngestId}&schema=ARRAY_OF_EVENTS`)
        .reply(200)
        .matchHeader('x-api-token', fakeApiKey)

      const authData = {
        api_key: fakeApiKey,
        ingest_id: fakeIngestId
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
