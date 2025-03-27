import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../index'
import { Features } from '@segment/actions-core/mapping-kit'
import { API_VERSION, CANARY_API_VERSION } from '../constants'

const features: Features = { 'facebook-custom-audience-actions-canary-version': true }

const adAccountId = '1500000000000000'
const audienceId = '1506489116128966'
const testDestination = createTestIntegration(Destination)
const BASE_URL = 'https://graph.facebook.com'

const getAudienceUrl = `https://graph.facebook.com/${API_VERSION}/`

const createAudienceInput = {
  settings: {
    retlAdAccountId: '123'
  },
  audienceName: '',
  audienceSettings: {
    engageAdAccountId: adAccountId,
    audienceDescription: 'We are the Mario Brothers and plumbing is our game.'
  },
  features: {}
}
const getAudienceInput = {
  externalId: audienceId,
  settings: {
    retlAdAccountId: '123'
  }
}

describe('Facebook Custom Audiences', () => {
  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should fail if no ad account ID is set', async () => {
      createAudienceInput.audienceName = 'The Void'
      createAudienceInput.audienceSettings.engageAdAccountId = ''
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should create a new Facebook Audience', async () => {
      nock(`${BASE_URL}/${CANARY_API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(200, { id: '88888888888888888' })

      createAudienceInput.audienceName = 'The Super Mario Brothers Fans'
      createAudienceInput.audienceSettings.engageAdAccountId = adAccountId

      const r = await testDestination.createAudience({ ...createAudienceInput, features })
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
      nock(`${BASE_URL}/${CANARY_API_VERSION}/`)
        .get(`/${audienceId}`)
        .reply(200, { id: `${audienceId}` })
      const r = await testDestination.getAudience({ ...getAudienceInput, features })
      expect(r).toEqual({ externalId: audienceId })
    })
  })
})
