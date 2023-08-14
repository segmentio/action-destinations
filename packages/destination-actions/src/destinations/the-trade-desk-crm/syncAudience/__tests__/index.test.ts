import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'

import { TTD_LEGACY_FLOW_FLAG_NAME } from '../../functions'

import { getAWSCredentialsFromEKS, AWSCredentials } from '../../../../lib/AWS/sts'
jest.mock('../../../../lib/AWS/sts')

let testDestination = createTestIntegration(Destination)

beforeEach(() => {
  // Re-Initialize the destination before each test
  // This is done to mitigate a bug where action responses persist into other tests
  testDestination = createTestIntegration(Destination)

  // Mock function to fetch AWS Credentials from STS
  ;(getAWSCredentialsFromEKS as jest.Mock).mockResolvedValue({
    accessKeyId: 'TESTACCESSKEY',
    secretAccessKey: 'mySuperSecretAccessKey',
    sessionToken: 'This is a super secret session token'
  } as AWSCredentials)
})

afterAll(() => {
  jest.resetModules()
})

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

    expect(responses.length).toBe(5)
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

    expect(responses.length).toBe(4)
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

    expect(responses.length).toBe(4)
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

  it('should execute legacy flow if flagon override is defined', async () => {
    const dropReferenceId = 'aabbcc5b01-c9c7-4000-9191-000000000000'
    const dropEndpoint = `https://thetradedesk-crm-data.s3.us-east-1.amazonaws.com/data/advertiser/advertiser-id/drop/${dropReferenceId}/pii?X-Amz-Security-Token=token&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=date&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=credentials&X-Amz-Signature=signature&`

    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id`)
      .get(/.*/)
      .reply(200, {
        Segments: [{ SegmentName: 'test_audience', CrmDataId: 'crm_data_id' }],
        PagingToken: 'paging_token'
      })

    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id?pagingToken=paging_token`)
      .get(/.*/)
      .reply(200, { Segments: [], PagingToken: null })

    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/crm_data_id`)
      .post(/.*/, { PiiType: 'Email', MergeMode: 'Replace' })
      .reply(200, { ReferenceId: dropReferenceId, Url: dropEndpoint })

    nock(dropEndpoint).put(/.*/).reply(200)

    const responses = await testDestination.testBatchAction('syncAudience', {
      events,
      settings: {
        advertiser_id: 'advertiser_id',
        auth_token: 'test_token',
        __segment_internal_engage_force_full_sync: true,
        __segment_internal_engage_batch_sync: true
      },
      features: {
        [TTD_LEGACY_FLOW_FLAG_NAME]: true
      },
      useDefaultMappings: true,
      mapping: {
        name: 'test_audience',
        region: 'US',
        pii_type: 'Email'
      }
    })

    expect(responses.length).toBe(4)
  })
})
