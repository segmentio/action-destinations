import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { IntegrationBaseUrl } from '../contants'

export const API_KEY = 'b95291ac-1bb8-47ed-af7b-c2809ba0e8e2'

const testDestination = createTestIntegration(Definition)

afterAll(() => {
  nock.cleanAll()
})

describe('InleadsAI', () => {
  describe('testAuthentication', () => {
    it('should validate authentication with apiKey', async () => {
      nock(`${IntegrationBaseUrl}`)
        .post('/events/validate/key', {
          apiKey: API_KEY
        }, {
          reqheaders: {
            Authorization: `Basic ${API_KEY}`
          }
        })
        .reply(200, {})


      await expect(testDestination.testAuthentication({ apiKey: API_KEY })).resolves.not.toThrowError()
    })
  })
})
