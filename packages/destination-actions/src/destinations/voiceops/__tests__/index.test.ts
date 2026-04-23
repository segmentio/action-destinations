import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { VOICEOPS_BASE_URL } from '../constants'

const testDestination = createTestIntegration(Definition)
const SETTINGS: Settings = {
  accessToken: 'voiceops-token'
}

describe('Voiceops', () => {
  describe('testAuthentication', () => {
    afterEach(() => {
      nock.cleanAll()
    })

    it('accepts a valid bearer token', async () => {
      nock(VOICEOPS_BASE_URL)
        .get('/frontline-api/integrations/v1/segment/authentication')
        .matchHeader('authorization', 'Bearer voiceops-token')
        .matchHeader('user-agent', 'Segment')
        .reply(200, {})

      await expect(testDestination.testAuthentication(SETTINGS)).resolves.toBeUndefined()
    })

    it('surfaces invalid bearer tokens as credential failures', async () => {
      nock(VOICEOPS_BASE_URL)
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
