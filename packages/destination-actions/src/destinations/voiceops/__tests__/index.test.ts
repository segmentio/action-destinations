import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { DEFAULT_VOICEOPS_BASE_URL } from '../constants'

const testDestination = createTestIntegration(Definition)
const SETTINGS: Settings = {
  accessToken: 'voiceops-token',
  baseUrl: DEFAULT_VOICEOPS_BASE_URL
}

describe('Voiceops', () => {
  describe('testAuthentication', () => {
    afterEach(() => {
      nock.cleanAll()
    })

    it('accepts a valid bearer token', async () => {
      nock(DEFAULT_VOICEOPS_BASE_URL)
        .get('/frontline-api/integrations/v1/segment/authentication')
        .matchHeader('authorization', 'Bearer voiceops-token')
        .matchHeader('user-agent', 'Segment')
        .reply(200, {})

      await expect(testDestination.testAuthentication(SETTINGS)).resolves.toBeUndefined()
    })

    it('uses the default base URL when the setting is omitted', async () => {
      const scope = nock(DEFAULT_VOICEOPS_BASE_URL)
        .get('/frontline-api/integrations/v1/segment/authentication')
        .matchHeader('authorization', 'Bearer voiceops-token')
        .reply(200, {})

      const settings: Settings = { accessToken: 'voiceops-token' }
      await expect(testDestination.testAuthentication(settings)).resolves.toBeUndefined()
      expect(scope.isDone()).toBe(true)
    })

    it.each(['', ' \t\n '])('uses the default base URL for blank settings %p', async (baseUrl) => {
      const scope = nock(DEFAULT_VOICEOPS_BASE_URL)
        .get('/frontline-api/integrations/v1/segment/authentication')
        .reply(200, {})

      await expect(testDestination.testAuthentication({ ...SETTINGS, baseUrl })).resolves.toBeUndefined()
      expect(scope.isDone()).toBe(true)
    })

    it.each(['not a url', '/relative', 'ftp://example.com'])('rejects an invalid base URL %p', async (baseUrl) => {
      const scope = nock(DEFAULT_VOICEOPS_BASE_URL)
        .get('/frontline-api/integrations/v1/segment/authentication')
        .reply(200, {})

      await expect(testDestination.testAuthentication({ ...SETTINGS, baseUrl })).rejects.toThrow()
      expect(scope.isDone()).toBe(false)
    })

    it('surfaces invalid bearer tokens as credential failures', async () => {
      nock(DEFAULT_VOICEOPS_BASE_URL)
        .get('/frontline-api/integrations/v1/segment/authentication')
        .matchHeader('authorization', 'Bearer voiceops-token')
        .reply(401, {
          message: 'Unauthorized'
        })

      await expect(testDestination.testAuthentication(SETTINGS)).rejects.toThrow(
        'Credentials are invalid:  Unauthorized'
      )
    })
  })
})
