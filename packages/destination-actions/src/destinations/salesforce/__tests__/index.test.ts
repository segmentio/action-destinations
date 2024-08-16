import nock from 'nock'
import { createTestIntegration, HTTPError, InvalidAuthenticationError } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)
const settings = {
  instanceUrl: 'https://test.salesforce.com/',
  isSandbox: false
}

const expectedRequest = {
  refresh_token: 'xyz321',
  client_id: 'clientId',
  client_secret: 'clientSecret',
  grant_type: 'refresh_token'
}

describe('Salesforce (Actions)', () => {
  describe('refreshAccessToken', () => {
    it('should return access token', async () => {
      const mockResponse = {
        access_token: 'abc123'
      }
      nock(`https://login.salesforce.com/services/oauth2/token`)
        .post('', new URLSearchParams(expectedRequest).toString())
        .reply(200, mockResponse)

      const token = await testDestination.refreshAccessToken(settings, {
        refreshToken: 'xyz321',
        accessToken: 'abc123',
        clientId: 'clientId',
        clientSecret: 'clientSecret'
      })

      expect(token).toEqual({ accessToken: mockResponse.access_token })
    })

    it('should use sandbox url when isSandbox settings is enabled', async () => {
      const mockResponse = {
        access_token: 'abc123'
      }
      nock(`https://test.salesforce.com/services/oauth2/token`)
        .post('', new URLSearchParams(expectedRequest).toString())
        .reply(200, mockResponse)

      const token = await testDestination.refreshAccessToken(
        { ...settings, isSandbox: true },
        {
          refreshToken: 'xyz321',
          accessToken: 'abc123',
          clientId: 'clientId',
          clientSecret: 'clientSecret'
        }
      )

      expect(token).toEqual({ accessToken: mockResponse.access_token })
    })

    it('should rethrow 401 error as InvalidAuthenticationError', async () => {
      nock(`https://login.salesforce.com/services/oauth2/token`)
        .post('', new URLSearchParams(expectedRequest).toString())
        .reply(401)

      await expect(
        testDestination.refreshAccessToken(settings, {
          refreshToken: 'xyz321',
          accessToken: 'abc123',
          clientId: 'clientId',
          clientSecret: 'clientSecret'
        })
      ).rejects.toThrowError(InvalidAuthenticationError)
    })

    it('should rethrow 400 error as InvalidAuthenticationError', async () => {
      nock(`https://login.salesforce.com/services/oauth2/token`)
        .post('', new URLSearchParams(expectedRequest).toString())
        .reply(401)

      await expect(
        testDestination.refreshAccessToken(settings, {
          refreshToken: 'xyz321',
          accessToken: 'abc123',
          clientId: 'clientId',
          clientSecret: 'clientSecret'
        })
      ).rejects.toThrowError(InvalidAuthenticationError)
    })

    it('should rethrow other errors as is', async () => {
      nock(`https://login.salesforce.com/services/oauth2/token`)
        .post('', new URLSearchParams(expectedRequest).toString())
        .reply(500)

      await expect(
        testDestination.refreshAccessToken(settings, {
          refreshToken: 'xyz321',
          accessToken: 'abc123',
          clientId: 'clientId',
          clientSecret: 'clientSecret'
        })
      ).rejects.toThrowError(HTTPError)
    })
  })
})
