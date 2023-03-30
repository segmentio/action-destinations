import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const VALID_SETTINGS = {
  apiKey: 'key'
}

const MOCK_TOKEN_RESPONSE = {
  success: true
}

describe('Rokt Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate valid auth token', async () => {
      nock('https://data.stage.rokt.com/').get('/api/1.0/auth-check').reply(200, MOCK_TOKEN_RESPONSE)
      const settings = VALID_SETTINGS
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should test that authentication fails', async () => {
      nock('https://data.stage.rokt.com/').get('/api/1.0/auth-check').reply(401)
      const settings = VALID_SETTINGS
      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError('')
    })
  })
})
