import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { BASE_URL } from '../constants'

const testDestination = createTestIntegration(Definition)

const validSettings = {
  oauth: {
    access_token: '123',
    refresh_token: '123'
  }
}

describe('Linkedin Conversions Api', () => {
  describe('testAuthentication', () => {
    it('should not throw an error if all the appropriate credentials are available', async () => {
      const mockProfileResponse = {
        id: '123'
      }

      // Validate that the user exists in LinkedIn.
      nock(`${BASE_URL}/me`).get(/.*/).reply(200, mockProfileResponse)

      await expect(testDestination.testAuthentication(validSettings)).resolves.not.toThrowError()
    })

    it('should throw an error if the user has not completed the oauth flow', async () => {
      const invalidOauth = {}
      await expect(testDestination.testAuthentication(invalidOauth)).rejects.toThrowError(
        'Credentials are invalid:  Please authenticate via Oauth before enabling the destination.'
      )
    })

    it('should throw an error if the oauth token is invalid', async () => {
      nock(`${BASE_URL}/me`).get(/.*/).reply(401)

      await expect(testDestination.testAuthentication(validSettings)).rejects.toThrowError(
        'Credentials are invalid:  Invalid LinkedIn Oauth access token. Please reauthenticate to retrieve a valid access token before enabling the destination.'
      )
    })
  })
})
