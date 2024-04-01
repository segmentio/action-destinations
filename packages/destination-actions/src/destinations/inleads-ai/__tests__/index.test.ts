import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { IntegrationBaseUrl } from '../contants'

export const API_KEY = 'testInleadsApiKey'

const testDestination = createTestIntegration(Definition)

beforeAll(() => {
  nock.disableNetConnect()
})

afterAll(() => {
  nock.enableNetConnect()
  nock.cleanAll()
})

describe('InleadsAI', () => {
  describe('testAuthentication', () => {
    it('should validate authentication with apiKey', async () => {
      nock(`${IntegrationBaseUrl}/events/validate/key`)
        .post('*', {}, {
          reqheaders: {
            Authorization: `Basic ${API_KEY}`
          }
        })
        .reply(200, {})


      await expect(testDestination.testAuthentication({ apiKey: API_KEY })).resolves.not.toThrowError()
    })
  })
})
