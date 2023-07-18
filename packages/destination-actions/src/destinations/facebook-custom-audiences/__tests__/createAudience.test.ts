import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination, { FACEBOOK_API_VERSION } from '../index'

const adAccountId = 1500000000000000
const testDestination = createTestIntegration(Destination)
const createAudienceUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/act_${adAccountId}`

describe('Facebook Custom Audiences', () => {
  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      const audienceInput = {
        settings: {},
        audienceName: '',
        accessToken: 'Expired',
        audienceSettings: {
          adAccountId: adAccountId,
          audienceDescription: 'We are the Mario Brothers and plumbing is our game.'
        }
      }

      await expect(testDestination.createAudience(audienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should fail if no ad account ID is set', async () => {
      const audienceInput = {
        settings: {},
        audienceName: 'The Unknown',
        accessToken: 'Expired',
        audienceSettings: {
          adAccountId: undefined,
          audienceDescription: 'We are The Void.'
        }
      }

      await expect(testDestination.createAudience(audienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should fail if no auth_token expired', async () => {
      nock(createAudienceUrl)
        .post('/customaudiences')
        .reply(400, {
          ok: false,
          error: {
            error: {
              message:
                "Unsupported post request. Object with ID 'act_1500000000000000' does not exist, cannot be loaded due to missing permissions, or does not support this operation. Please read the Graph API documentation at https://developers.facebook.com/docs/graph-api",
              type: 'GraphMethodException',
              code: 100,
              error_subcode: 33,
              fbtrace_id: 'AfdfLHcmv0_U_n7WtgRuvDL'
            }
          }
        })

      const audienceInput = {
        settings: {},
        audienceName: 'The Super Mario Brothers Fans',
        accessToken: 'Expired',
        audienceSettings: {
          adAccountId: adAccountId,
          audienceDescription: 'We are the Mario Brothers and plumbing is our game.'
        }
      }

      await expect(testDestination.createAudience(audienceInput)).rejects.toThrowError()
    })

    it('should create a new Facebook Audience', async () => {
      nock(createAudienceUrl).post('/customaudiences').reply(200, { id: '88888888888888888' })

      const audienceInput = {
        settings: {},
        audienceName: 'The Super Mario Brothers Fans',
        accessToken: 'Valid',
        audienceSettings: {
          adAccountId: adAccountId,
          audienceDescription: 'We are the Mario Brothers and plumbing is our game.'
        }
      }

      const r = await testDestination.createAudience(audienceInput)
      expect(r).toEqual({ externalId: '88888888888888888' })
    })
  })
})
