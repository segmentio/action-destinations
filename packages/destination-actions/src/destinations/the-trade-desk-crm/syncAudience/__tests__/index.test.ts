import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'

import { getAWSCredentialsFromEKS, AWSCredentials } from '../../../../lib/AWS/sts'
jest.mock('../../../../lib/AWS/sts')

// Backup and restore environment variables with each test
const OLD_ENV = process.env

beforeEach(() => {
  ;(getAWSCredentialsFromEKS as jest.Mock).mockResolvedValue({
    accessKeyId: 'TESTACCESSKEY',
    secretAccessKey: 'mySuperSecretAccessKey',
    sessionToken: 'This is a super secret session token'
  } as AWSCredentials)

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
  jest.resetModules()
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

// Push Gmail addresses
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
        email: `some.id+testing@gmail.com`
      }
    }
  })
)

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
  it('should succeed and create a Segment if an existing CRM Segment is not found', async () => {
    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id`)
      .get(/.*/)
      .reply(200, {
        Segments: [{ SegmentName: 'not_test_audience', CrmDataId: 'crm_data_id' }],
        PagingToken: 'paging_token'
      })

    nock(`https://api.thetradedesk.com/v3/crmdata/segment`)
      .post(/.*/)
      .reply(200, {
        data: {
          CrmDataId: 'test_audience'
        }
      })

    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id?pagingToken=paging_token`)
      .get(/.*/)
      .reply(200, { Segments: [], PagingToken: null })

    // // create drop endpoint
    // nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/crm_data_id`)
    //   .post(/.*/, { PiiType: 'Email', MergeMode: 'Replace' })
    //   .reply(200, { Url: 'https://api.thetradedesk.com/drop' })

    nock(/https?:\/\/([a-z0-9-]+)\.s3\.([a-z0-9-]+)\.amazonaws\.com:.*/)
      .put(/.*/)
      .reply(200)

    nock(/https?:\/\/([a-z0-9-]+)\.s3\.([a-z0-9-]+)\.amazonaws\.com:.*/)
      .put(/.*/)
      .reply(200)

    const responses = await testDestination.testBatchAction('syncAudience', {
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

    expect(responses).toBeTruthy()
  })

  it('should succeed and update a Segment with Email if an existing CRM Segment is not found', async () => {
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

    nock(/https?:\/\/([a-z0-9-]+)\.s3\.([a-z0-9-]+)\.amazonaws\.com:.*/)
      .put(/.*/)
      .reply(200)

    nock(/https?:\/\/([a-z0-9-]+)\.s3\.([a-z0-9-]+)\.amazonaws\.com:.*/)
      .put(/.*/)
      .reply(200)

    const responses = await testDestination.testBatchAction('syncAudience', {
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

    expect(responses).toBeTruthy()
  })

  it('should succeed and update a Segment with EmailHashedUnifiedId2 if an existing CRM Segment is not found', async () => {
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
      .post(/.*/, { PiiType: 'EmailHashedUnifiedId2', MergeMode: 'Replace' })
      .reply(200, { Url: 'https://api.thetradedesk.com/drop' })

    nock(/https?:\/\/([a-z0-9-]+)\.s3\.([a-z0-9-]+)\.amazonaws\.com:.*/)
      .put(/.*/)
      .reply(200)

    nock(/https?:\/\/([a-z0-9-]+)\.s3\.([a-z0-9-]+)\.amazonaws\.com:.*/)
      .put(/.*/)
      .reply(200)

    const responses = await testDestination.testBatchAction('syncAudience', {
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
        pii_type: 'EmailHashedUnifiedId2'
      }
    })

    expect(responses.length).toBeTruthy()
  })

  it('should fail if multiple CRM Segments found with same name', async () => {
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
