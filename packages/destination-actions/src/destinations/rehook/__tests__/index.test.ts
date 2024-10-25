import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const api_key = 'API_KEY'
const api_secret = 'API_SECRET'

const testDestination = createTestIntegration(Definition)

describe('Rehook', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.rehook.ai').get('/events/segment/check-auth').reply(200, { status: 'ok' })

      const settings = {
        api_key: api_key,
        api_secret: api_secret
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
