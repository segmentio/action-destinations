import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION, BASE_URL } from '../constants'

const adAccountId = '1500000000000000'
const audienceId = '1506489116128966'
const testDestination = createTestIntegration(Destination)

const getAudienceUrl = `${BASE_URL}/${API_VERSION}/`

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
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(200, { id: '88888888888888888' })

      createAudienceInput.audienceName = 'The Super Mario Brothers Fans'
      createAudienceInput.audienceSettings.engageAdAccountId = adAccountId

      const r = await testDestination.createAudience(createAudienceInput)
      expect(r).toEqual({ externalId: '88888888888888888' })
    })

    it('should use error_user_title and error_user_msg when both are present', async () => {
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(400, {
          error: {
            message: 'Invalid parameter',
            type: 'OAuthException',
            code: 100,
            error_user_title: 'Update Restricted Fields and Rule',
            error_user_msg: 'This custom audience has integrity restrictions.'
          }
        })

      createAudienceInput.audienceName = 'Restricted Audience'
      createAudienceInput.audienceSettings.engageAdAccountId = adAccountId

      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrow(
        'Update Restricted Fields and Rule: This custom audience has integrity restrictions.'
      )
    })

    it('should use error_user_msg alone when error_user_title is absent', async () => {
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(400, {
          error: {
            message: 'Invalid parameter',
            type: 'OAuthException',
            code: 100,
            error_user_msg: 'This custom audience has integrity restrictions.'
          }
        })

      createAudienceInput.audienceName = 'Restricted Audience'
      createAudienceInput.audienceSettings.engageAdAccountId = adAccountId

      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrow(
        'This custom audience has integrity restrictions.'
      )
    })

    it('should fall back to the raw message when no user-facing fields are present', async () => {
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(400, {
          error: {
            message: 'Invalid parameter',
            type: 'OAuthException',
            code: 100
          }
        })

      createAudienceInput.audienceName = 'Restricted Audience'
      createAudienceInput.audienceSettings.engageAdAccountId = adAccountId

      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrow('Invalid parameter')
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
