import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'

// Backup and restore environment variables with each test
const OLD_ENV = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = {
    ...OLD_ENV,

    // Hardcode dummy AWS credentials for testing
    AWS_REGION: 'us-west-2',
    NODE_ENV: 'stage',
    AWS_ACCESS_KEY_ID: 'test',
    AWS_SECRET_ACCESS_KEY: 'test',
    AWS_SESSION_TOKEN: 'test'
  }
})

afterAll(() => {
  process.env = OLD_ENV
})

const testDestination = createTestIntegration(Destination)

const events: SegmentEvent[] = []
for (let index = 1; index <= 1500; index++) {
  events.push(
    createTestEvent({
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
          email: `testing${index}@testing.com`
        }
      }
    })
  )
}

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
  // it('should succeed and create a Segment if an exisitng CRM Segment is not found', async () => {
  //   // get all CRMS
  //   nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id`)
  //     .get(/.*/)
  //     .reply(200, {
  //       Segments: [{ SegmentName: 'test_audience', CrmDataId: 'crm_data_id' }],
  //       PagingToken: 'paging_token'
  //     })
  //   nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id?pagingToken=paging_token`)
  //     .get(/.*/)
  //     .reply(200, { Segments: [], PagingToken: null })

  //   // create drop endpoint
  //   nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/crm_data_id`)
  //     .post(/.*/, { PiiType: 'Email', MergeMode: 'Replace' })
  //     .reply(200, { Url: 'https://api.thetradedesk.com/drop' })

  //   nock(/https?:\/\/([a-z0-9-]+)\.s3\.([a-z0-9-]+)\.amazonaws\.com:.*/)
  //     .put(/.*/)
  //     .reply(200)

  //   nock(/https?:\/\/sqs\.([a-z0-9-]+)\.amazonaws\.com:.*/)
  //     .post(/.*/)
  //     .reply(
  //       200,
  //       `
  //     <?xml version="1.0"?>
  //     <SendMessageResponse xmlns="http://queue.amazonaws.com/doc/2012-11-05/">
  //         <SendMessageResult>
  //             <MessageId>85b4fd48-be30-483a-bd22-a91b393b0bfe</MessageId>
  //             <MD5OfMessageBody>79a831c35f460c8f0e6f09730c67dc92</MD5OfMessageBody>
  //             <SequenceNumber>37326220843981279488</SequenceNumber>
  //         </SendMessageResult>
  //         <ResponseMetadata>
  //             <RequestId>1d00ba86-60f8-5e35-82e4-e7bc84c50244</RequestId>
  //         </ResponseMetadata>
  //     </SendMessageResponse>
  //     `
  //     )

  //   // // drop users in the endpoint
  //   // nock(`https://api.thetradedesk.com/drop`).put(/.*/).reply(200)

  //   const responses = await testDestination.testBatchAction('syncAudience', {
  //     events,
  //     settings: {
  //       advertiser_id: 'advertiser_id',
  //       auth_token: 'test_token',
  //       __segment_internal_engage_force_full_sync: true,
  //       __segment_internal_engage_batch_sync: true
  //     },
  //     useDefaultMappings: true,
  //     mapping: {
  //       name: 'test_audience',
  //       region: 'US',
  //       pii_type: 'Email'
  //     }
  //   })
  // })

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
      testDestination.testBatchAction('syncAudience', {
        events,
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

  it('should fail if batch has less than 1500', async () => {
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
    ).rejects.toThrow(`received payload count below The Trade Desk's ingestion limits. Expected: >=1500 actual: 1`)
  })
})
