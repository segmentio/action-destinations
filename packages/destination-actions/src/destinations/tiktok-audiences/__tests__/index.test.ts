import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import { BASE_URL, GET_AUDIENCE_URL, TIKTOK_API_VERSION } from '../constants'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

const idType = 'EMAIL_SHA256'
const audienceId = '888888888'
const advertiserId = '42884288'

const createAudienceInput = {
  settings: {
    advertiser_ids: [advertiserId] // TODO: Remove on cleanup
  },
  audienceName: '',
  audienceSettings: {
    advertiserId: advertiserId,
    idType: idType
  }
}

const getAudienceInput = {
  settings: {
    advertiser_ids: [advertiserId] // TODO: Remove on cleanup
  },
  externalId: audienceId,
  audienceSettings: {
    advertiserId: advertiserId,
    idType: idType
  }
}

const mockGetAudienceResponse = (replyObject: any) => {
  nock(GET_AUDIENCE_URL)
    .get('')
    .query({
      advertiser_id: advertiserId,
      custom_audience_ids: JSON.stringify([audienceId])
    })
    .reply(200, replyObject)
}

const getAudienceResponse = {
  code: 0,
  message: 'OK',
  request_id: '20230804CEF3B42',
  data: {
    list: [
      {
        audience_history: [
          {
            opt_time: '2023-08-03 16:27:49',
            action: 'create',
            msg: null,
            editor: 'open_api',
            action_detail: '0'
          }
        ],
        audience_details: {
          is_auto_refresh: false,
          is_expiring: false,
          shared: false,
          expired_time: '2024-08-02 16:27:49',
          calculate_type: 'MULTIPLE_TYPES',
          error_msg: null,
          name: 'The Super Mario Brothers Super Audience',
          is_valid: false,
          is_creator: true,
          msg: null,
          audience_sub_type: 'NORMAL',
          type: 'Partner',
          cover_num: 0,
          audience_id: audienceId,
          create_time: '2023-08-03 16:27:49',
          rule: '{"inclusions": null, "exclusions": null}'
        }
      }
    ]
  }
}

describe('Tik Tok Audiences', () => {
  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should fail if no advertiser ID is set', async () => {
      createAudienceInput.audienceName = 'The Void'
      createAudienceInput.audienceSettings.advertiserId = ''
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should create a new TikTok Audience', async () => {
      nock(BASE_URL)
        .post(`/${TIKTOK_API_VERSION}/segment/audience/`, {
          custom_audience_name: 'The Super Mario Brothers Fans',
          advertiser_id: '42884288',
          id_type: 'EMAIL_SHA256',
          action: 'create'
        })
        .reply(200, {
          code: 0,
          message: 'OK',
          request_id: '202308032127455B021E952',
          data: {
            audience_id: audienceId
          }
        })

      createAudienceInput.audienceName = 'The Super Mario Brothers Fans'
      createAudienceInput.audienceSettings.advertiserId = advertiserId

      const r = await testDestination.createAudience(createAudienceInput)
      expect(r).toEqual({ externalId: audienceId })
    })
  })

  describe('getAudience', () => {
    it('should fail if TikTok replies with an error', async () => {
      await expect(testDestination.getAudience(getAudienceInput)).rejects.toThrowError()
    })

    it("should fail if Segment Audience ID doesn't match TikTok Audience ID", async () => {
      getAudienceResponse.data.list[0].audience_details.audience_id = '424242' // Different audience_id
      mockGetAudienceResponse(getAudienceResponse)
      await expect(testDestination.getAudience(getAudienceInput)).rejects.toThrow(
        "Unable to verify ownership over audience. Segment Audience ID doesn't match TikToks Audience ID."
      )
    })

    it('should succeed when Segment Audience ID matches TikTok audience ID', async () => {
      getAudienceResponse.data.list[0].audience_details.audience_id = getAudienceInput.externalId
      mockGetAudienceResponse(getAudienceResponse)

      const r = await testDestination.getAudience(getAudienceInput)
      expect(r).toEqual({ externalId: audienceId })
    })
  })
})
