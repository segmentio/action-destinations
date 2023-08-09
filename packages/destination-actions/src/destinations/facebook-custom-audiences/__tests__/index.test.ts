import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination, { FACEBOOK_API_VERSION } from '../index'

const adAccountId = 1500000000000000
const audienceId = '1506489116128966'
const testDestination = createTestIntegration(Destination)
const getAudienceUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/`
const createAudienceUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/act_${adAccountId}`

const createAudienceInput = {
  settings: {},
  audienceName: '',
  audienceSettings: {
    adAccountId: adAccountId,
    audienceDescription: 'We are the Mario Brothers and plumbing is our game.'
  }
}
const getAudienceInput = {
  externalId: audienceId,
  settings: {}
}

describe('Facebook Custom Audiences', () => {
  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should fail if no ad account ID is set', async () => {
      createAudienceInput.audienceName = 'The Void'
      createAudienceInput.audienceSettings.adAccountId = 0
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should create a new Facebook Audience', async () => {
      nock(createAudienceUrl).post('/customaudiences').reply(200, { id: '88888888888888888' })

      createAudienceInput.audienceName = 'The Super Mario Brothers Fans'
      createAudienceInput.audienceSettings.adAccountId = adAccountId

      const r = await testDestination.createAudience(createAudienceInput)
      expect(r).toEqual({ externalId: '88888888888888888' })
    })
  })

  describe('getAudience', () => {
    it('should fail if FB replies with an error ID', async () => {
      nock(getAudienceUrl).get(`/${audienceId}`).reply(400, {})
      await expect(testDestination.getAudience(getAudienceInput)).rejects.toThrowError()
    })

    it("should fail if Segment Audience ID doesn't match FB Audience ID", async () => {
      nock(getAudienceUrl).get(`/${audienceId}`).reply(200, { id: '42' })
      await expect(testDestination.getAudience(getAudienceInput)).rejects.toThrowError()
    })

    it('should succeed when Segment Audience ID matches FB audience ID', async () => {
      nock(getAudienceUrl)
        .get(`/${audienceId}`)
        .reply(200, { id: `${audienceId}` })
      const r = await testDestination.getAudience(getAudienceInput)
      expect(r).toEqual({ externalId: audienceId })
    })
  })
})
