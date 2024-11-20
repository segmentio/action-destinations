import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { CONSTANTS } from '../constants'

const testDestination = createTestIntegration(Definition)

const VALID_SETTINGS = {
  rpub: 'rpub-***',
  rsec: 'rsec-***',
  accountid: '8675309'
}

const MOCK_TOKEN_RESPONSE = {
  success: true
}

describe('Rokt Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate proper rpub-rsec credentials', async () => {
      nock(CONSTANTS.ROKT_API_BASE_URL).post(CONSTANTS.ROKT_API_AUTH_ENDPOINT).reply(200, MOCK_TOKEN_RESPONSE)
      const settings = VALID_SETTINGS
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should test that authentication fails', async () => {
      nock(CONSTANTS.ROKT_API_BASE_URL).post(CONSTANTS.ROKT_API_AUTH_ENDPOINT).reply(401)
      const settings = VALID_SETTINGS
      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError('')
    })
  })
})
