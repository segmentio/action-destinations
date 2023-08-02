import { createTestIntegration, ExecuteInput } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { M3TER_AUTH_API, USER_AGENT_HEADER } from '../constants'
import nock from 'nock'
import { AccessTokenResponse } from '../auth'

const testDestination = createTestIntegration(Definition)

describe('m3ter', () => {
  const settings: Settings = {
    access_key_id: 'validAccessKeyId',
    api_secret: 'validApiSecret',
    org_id: 'someOrgId'
  }
  describe('testAuthentication', () => {
    it('should correctly authenticate given correct settings ', async function () {
      const response: AccessTokenResponse = {
        token_type: 'bearer',
        access_token: 'someTokenValue',
        expires_in: 122222222
      }
      nock(M3TER_AUTH_API)
        .post(`/oauth/token`, '{"grant_type":"client_credentials"}')
        .matchHeader(
          'authorization',
          `Basic ${Buffer.from(`${settings.access_key_id}:${settings.api_secret}`).toString('base64')}`
        )
        .matchHeader('Content-Type', 'application/json')
        .reply(200, response)

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
    it('should throw exception if auth has failed', async function () {
      const response = {
        error: 'invalid_request',
        error_description: 'Invalid Credentials'
      }
      nock(M3TER_AUTH_API)
        .post(`/oauth/token`, '{"grant_type":"client_credentials"}')
        .matchHeader(
          'authorization',
          `Basic ${Buffer.from(`${settings.access_key_id}:${settings.api_secret}`).toString('base64')}`
        )
        .matchHeader('Content-Type', 'application/json')
        .reply(401, response)

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })
  })
  describe('extendRequest', () => {
    it('should populate headers with Bearer authentication and User-Agent', async () => {
      const accessToken = 'validAccessToken'
      const authData: Partial<ExecuteInput<Settings, any>> = {
        auth: {
          accessToken,
          refreshToken: ''
        }
      }
      const extendedRequest = testDestination.extendRequest?.(authData as ExecuteInput<Settings, any>)

      expect(extendedRequest?.headers?.['Authorization']).toContain(`Bearer ${accessToken}`)
      expect(extendedRequest?.headers?.['User-Agent']).toContain(USER_AGENT_HEADER)
    })
  })
})
