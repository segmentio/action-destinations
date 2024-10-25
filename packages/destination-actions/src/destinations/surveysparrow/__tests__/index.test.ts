import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Surveysparrow', () => {
  describe('testAuthentication', () => {
    const authData = {
      apiToken: 'CUSTOM_AUTH_TOKEN'
    }

    it('should validate authentication inputs', async () => {
      nock('https://api.surveysparrow.com').get('/v3/users').reply(200, {})

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock('https://api.surveysparrow.com').get('/v3/users').reply(401, {})

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
