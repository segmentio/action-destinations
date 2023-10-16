import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../index'

const testDestination = createTestIntegration(Destination)

const createAudienceInput = {
  settings: {
    auth_token: 'AUTH_TOKEN',
    advertiser_id: 'ADVERTISER_ID',
    __segment_internal_engage_force_full_sync: true,
    __segment_internal_engage_batch_sync: true
  },
  audienceName: '',
  audienceSettings: {
    region: 'US'
  }
}

const getAudienceInput = {
  settings: {
    auth_token: 'AUTH_TOKEN',
    advertiser_id: 'ADVERTISER_ID',
    __segment_internal_engage_force_full_sync: true,
    __segment_internal_engage_batch_sync: true
  },
  externalId: 'crm_data_id',
  audienceSettings: {
    region: 'US'
  }
}

describe('The Trade Desk CRM', () => {
  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should create a new Trade Desk CRM Data Segment', async () => {
      nock(`https://api.thetradedesk.com/${API_VERSION}/crmdata/segment`).post(/.*/).reply(200, {
        CrmDataId: 'test_audience'
      })

      createAudienceInput.audienceName = 'The Super Mario Brothers Fans'
      createAudienceInput.audienceSettings.region = 'US'

      const r = await testDestination.createAudience(createAudienceInput)
      expect(r).toEqual({ externalId: 'test_audience' })
    })
  })

  describe('getAudience', () => {
    it('should fail if Trade Desk replies with an error', async () => {
      nock(`https://api.thetradedesk.com/${API_VERSION}/crmdata/segment/advertiser_id?pagingToken=paging_token`)
        .get(/.*/)
        .reply(400, { Segments: [], PagingToken: null })
      await expect(testDestination.getAudience(getAudienceInput)).rejects.toThrowError()
    })

    it('should succeed when Segment External ID matches Data Segment in TikTok', async () => {
      nock(`https://api.thetradedesk.com/${API_VERSION}/crmdata/segment/advertiser_id`)
        .get(/.*/)
        .reply(200, {
          Segments: [{ SegmentName: 'not_test_audience', CrmDataId: 'crm_data_id' }],
          PagingToken: 'paging_token'
        })
      nock(`https://api.thetradedesk.com/${API_VERSION}/crmdata/segment/advertiser_id?pagingToken=paging_token`)
        .get(/.*/)
        .reply(200, { Segments: [], PagingToken: null })

      const r = await testDestination.getAudience(getAudienceInput)
      expect(r).toEqual({ externalId: 'crm_data_id' })
    })
  })
})
