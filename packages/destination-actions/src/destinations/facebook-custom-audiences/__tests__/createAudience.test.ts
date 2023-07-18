import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination, { FACEBOOK_API_VERSION } from '../index'

const adAccountId = 1500000000000000
const testDestination = createTestIntegration(Destination)
const createAudienceUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/act_${adAccountId}`
const audienceInput = {
  settings: {},
  audienceName: '',
  accessToken: 'Expired',
  audienceSettings: {
    adAccountId: adAccountId,
    audienceDescription: 'We are the Mario Brothers and plumbing is our game.'
  }
}

describe('Facebook Custom Audiences', () => {
  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      await expect(testDestination.createAudience(audienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should fail if no ad account ID is set', async () => {
      audienceInput.audienceName = 'The Void'
      audienceInput.audienceSettings.adAccountId = 0
      await expect(testDestination.createAudience(audienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should fail if no auth_token expired', async () => {
      nock(createAudienceUrl).post('/customaudiences').reply(400, {})
      audienceInput.accessToken = 'Expired'
      await expect(testDestination.createAudience(audienceInput)).rejects.toThrowError()
    })

    it('should create a new Facebook Audience', async () => {
      nock(createAudienceUrl).post('/customaudiences').reply(200, { id: '88888888888888888' })

      audienceInput.accessToken = 'Valid'
      audienceInput.audienceName = 'The Super Mario Brothers Fans'
      audienceInput.audienceSettings.adAccountId = adAccountId

      const r = await testDestination.createAudience(audienceInput)
      expect(r).toEqual({ externalId: '88888888888888888' })
    })
  })
})
