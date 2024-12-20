import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Accoil Analytics', () => {
  describe('testAuthentication', () => {
    it('should Test Auth Header', async () => {
      nock('https://in.accoil.com')
        .post('/segment')
        .reply(400, { message: "API Key should start with 'Basic' and be followed by a space and your API key." })

      // This should match your authentication.fields
      const authData = { api_key: 'secret' }
      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
