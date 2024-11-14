import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import SnapAudiences from '../index'

const testDestination = createTestIntegration(SnapAudiences)
const audienceId = '11111111'
const ad_account_id = '22222222'

const createAudienceInput = {
  settings: {
    ad_account_id
  },
  audienceName: 'Segment Audience Name',
  audienceSettings: {
    customAudienceName: 'Custom Name',
    description: '',
    retention_in_days: 9999
  }
}

describe('Snap Audiences', () => {
  describe('createAudience', () => {
    beforeEach(() => {
      // Catch all Segment API requests and return 200
      nock('https://api.segment.io').persist().post('/v1/track').reply(200)
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should fail if Segment audience name is available', async () => {
      createAudienceInput.audienceName = ''
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('create a new Snap Audience', async () => {
      nock(`https://adsapi.snapchat.com`)
        .post(`/v1/adaccounts/${ad_account_id}/segments`, {
          segments: [
            {
              name: 'Custom Name',
              source_type: 'FIRST_PARTY',
              ad_account_id: ad_account_id,
              description: '',
              retention_in_days: 9999
            }
          ]
        })
        .reply(200, {
          segments: [
            {
              segment: {
                id: audienceId
              }
            }
          ]
        })

      createAudienceInput.audienceName = 'Snap Audience Name'

      const res = await testDestination.createAudience(createAudienceInput)
      expect(res).toEqual({ externalId: audienceId })
    })
  })

  // describe('getAudience', () => {
  // })
})
