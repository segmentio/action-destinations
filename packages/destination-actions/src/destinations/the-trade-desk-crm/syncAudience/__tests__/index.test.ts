import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const event = createTestEvent({
  event: 'Audience Entered',
  type: 'track',
  properties: {
    audience_key: 'personas_test_audience'
  },
  context: {
    device: {
      advertisingId: '123'
    },
    traits: {
      email: 'testing@testing.com'
    }
  }
})

describe('TheTradeDeskCrm.syncAudience', () => {
  it('should succeed and create a Segment if an exisitng CRM Segment is not found', async () => {
    // get all CRMS
    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id`)
      .get(/.*/)
      .reply(200, {
        Segments: [{ SegmentName: 'test_audience', CrmDataId: 'crm_data_id' }],
        PagingToken: 'paging_token'
      })
    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id?pagingToken=paging_token`)
      .get(/.*/)
      .reply(200, { Segments: [], PagingToken: null })

    // create drop endpoint
    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/crm_data_id`)
      .post(/.*/, { PiiType: 'Email', MergeMode: 'Replace' })
      .reply(200, { Url: 'https://api.thetradedesk.com/drop' })

    // drop users in the endpoint
    nock(`https://api.thetradedesk.com/drop`).put(/.*/).reply(200)

    const responses = await testDestination.testAction('syncAudience', {
      event,
      settings: {
        advertiser_id: 'advertiser_id',
        auth_token: 'test_token',
        __segment_internal_engage_force_full_sync: true,
        __segment_internal_engage_batch_sync: true
      },
      useDefaultMappings: true,
      mapping: {
        name: 'test_audience',
        region: 'US',
        pii_type: 'Email'
      }
    })

    expect(responses.length).toBe(4)
    expect(responses[3].status).toBe(200)
    expect(responses[3].options.body).toMatchInlineSnapshot(`
      "testing@testing.com
      "
    `)
  })

  it('should succeed and create a Segment if an exisitng CRM Segment is not found', async () => {
    // get all CRMS
    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id`)
      .get(/.*/)
      .reply(200, {
        Segments: [{ SegmentName: 'test_audience', CrmDataId: 'crm_data_id' }],
        PagingToken: 'paging_token'
      })
    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id?pagingToken=paging_token`)
      .get(/.*/)
      .reply(200, { Segments: [], PagingToken: null })

    // create CRM Data Segment
    nock(`https://api.thetradedesk.com/v3/crmdata/segment`)
      .post(/.*/, { AdvertiserId: 'advertiser_id', SegmentName: 'test_audience_1', Region: 'US' })
      .reply(200, { CrmDataId: 'crm_data_id' })

    // create drop endpoint
    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/crm_data_id`)
      .post(/.*/, { PiiType: 'EmailHashedUnifiedId2', MergeMode: 'Replace' })
      .reply(200, { Url: 'https://api.thetradedesk.com/drop' })

    // drop users in the endpoint
    nock(`https://api.thetradedesk.com/drop`).put(/.*/).reply(200)

    const responses = await testDestination.testAction('syncAudience', {
      event,
      settings: {
        advertiser_id: 'advertiser_id',
        auth_token: 'test_token',
        __segment_internal_engage_force_full_sync: true,
        __segment_internal_engage_batch_sync: true
      },
      useDefaultMappings: true,
      mapping: {
        name: 'test_audience_1',
        region: 'US',
        pii_type: 'EmailHashedUnifiedId2'
      }
    })

    expect(responses.length).toBe(5)
    expect(responses[4].status).toBe(200)
    expect(responses[4].options.body).toMatchInlineSnapshot(`
      "WExEI8Qh30mVV1lJinFJWrpJuHgOuTh9/zM7bwmCx3c=
      "
    `)
  })

  it('should fail if multiple CRM Segments found with same name', async () => {
    // get all CRMS
    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id`)
      .get(/.*/)
      .reply(200, {
        Segments: [
          { SegmentName: 'test_audience', CrmDataId: 'crm_data_id' },
          { SegmentName: 'test_audience', CrmDataId: 'crm_data_id' }
        ],
        PagingToken: 'paging_token'
      })
    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id?pagingToken=paging_token`)
      .get(/.*/)
      .reply(200, { Segments: [], PagingToken: null })

    await expect(
      testDestination.testAction('syncAudience', {
        event,
        settings: {
          advertiser_id: 'advertiser_id',
          auth_token: 'test_token',
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        useDefaultMappings: true,
        mapping: {
          name: 'test_audience',
          region: 'US',
          pii_type: 'Email'
        }
      })
    ).rejects.toThrow('Multiple audiences found with the same name')
  })
})
