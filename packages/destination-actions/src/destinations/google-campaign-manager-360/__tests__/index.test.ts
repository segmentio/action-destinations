import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Campaign Manager 360', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://your.destination.endpoint').get('*').reply(200, {})

      // For now we won't need this.
      // This is just a placeholder to test the authentication function.
      const authData = {
        profileId: '12345',
        defaultFloodlightActivityId: '23456',
        defaultFloodlightConfigurationId: '34567'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh the access token, normal scenario', async () => {
      nock(`https://www.googleapis.com/oauth2/v4/token`).post('').reply(200, {
        access_token: 'my.access.token'
      })

      const result = await testDestination.refreshAccessToken(
        {
          profileId: '12345',
          defaultFloodlightActivityId: '23456',
          defaultFloodlightConfigurationId: '34567'
        },
        {
          accessToken: 'blah-blah-blah',
          refreshToken: 'yada-yada-yada',
          clientId: '123',
          clientSecret: '456'
        }
      )
      expect(result).toEqual({ accessToken: 'my.access.token' })
    })

    it('should refresh the access token, error scenario, HTTP 400', async () => {
      nock(`https://www.googleapis.com/oauth2/v4/token`).post('').reply(400, {
        error: 'invalid_grant'
      })

      await expect(
        testDestination.refreshAccessToken(
          {
            profileId: '12345',
            defaultFloodlightActivityId: '23456',
            defaultFloodlightConfigurationId: '34567'
          },
          {
            accessToken: 'blah-blah-blah',
            refreshToken: 'yada-yada-yada',
            clientId: '123',
            clientSecret: '456'
          }
        )
      ).rejects.toThrowError()
    })

    it('should refresh the access token, error scenario, HTTP 2XX, invalid response', async () => {
      nock(`https://www.googleapis.com/oauth2/v4/token`).post('').reply(200, {})

      const result = await testDestination.refreshAccessToken(
        {
          profileId: '12345',
          defaultFloodlightActivityId: '23456',
          defaultFloodlightConfigurationId: '34567'
        },
        {
          accessToken: 'blah-blah-blah',
          refreshToken: 'yada-yada-yada',
          clientId: '123',
          clientSecret: '456'
        }
      )

      expect(result).toEqual({ accessToken: undefined })
    })
  })
})
