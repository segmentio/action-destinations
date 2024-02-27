import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Optimizely Data Platform', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/auth').reply(200)

      // This should match your authentication.fields
      const authData = {
        apiKey: 'test',
        region: 'US'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
