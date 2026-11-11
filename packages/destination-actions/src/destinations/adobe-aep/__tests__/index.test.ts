import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import type { ExecuteInput } from '@segment/actions-core'
import Definition from '../index'
import type { Settings } from '../generated-types'
import { IMS_SCOPE } from '../constants'

const testDestination = createTestIntegration(Definition)
const settings: Settings = { client_id: 'client-id', client_secret: 'client-secret' }

const IMS_HOST = 'https://ims-na1.adobelogin.com'

const tokenBody = (body: string) => {
  const params = new URLSearchParams(body)
  return (
    params.get('grant_type') === 'client_credentials' &&
    params.get('client_id') === 'client-id' &&
    params.get('client_secret') === 'client-secret' &&
    params.get('scope') === IMS_SCOPE
  )
}

describe('Adobe AEP', () => {
  afterEach(() => nock.cleanAll())

  describe('testAuthentication', () => {
    it('passes when IMS issues a token', async () => {
      nock(IMS_HOST)
        .post('/ims/token/v3', tokenBody)
        .reply(200, { access_token: 'token', token_type: 'bearer', expires_in: 86399999 })

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('fails when IMS rejects the credentials', async () => {
      nock(IMS_HOST).post('/ims/token/v3').reply(400, { error: 'invalid_client' })

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })
  })

  describe('refreshAccessToken', () => {
    it('returns the new access token', async () => {
      nock(IMS_HOST)
        .post('/ims/token/v3', tokenBody)
        .reply(200, { access_token: 'fresh-token', token_type: 'bearer', expires_in: 86399999 })

      const result = await testDestination.refreshAccessToken(settings, {
        accessToken: 'old',
        refreshToken: '',
        clientId: '',
        clientSecret: ''
      })
      expect(result).toEqual({ accessToken: 'fresh-token' })
    })
  })

  describe('extendRequest', () => {
    it('adds the bearer token and x-api-key', () => {
      const input = { settings, auth: { accessToken: 'abc', refreshToken: '' } } as unknown as ExecuteInput<
        Settings,
        unknown
      >
      const extended = testDestination.extendRequest?.(input)
      expect(extended?.headers).toEqual({ Authorization: 'Bearer abc', 'x-api-key': 'client-id' })
    })

    it('omits Authorization when there is no token', () => {
      const input = { settings } as unknown as ExecuteInput<Settings, unknown>
      const extended = testDestination.extendRequest?.(input)
      expect(extended?.headers).toEqual({ 'x-api-key': 'client-id' })
    })
  })
})
