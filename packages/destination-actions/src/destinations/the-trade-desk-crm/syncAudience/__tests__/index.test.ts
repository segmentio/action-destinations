import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import Destination from '../../index'

import { TTD_LEGACY_FLOW_FLAG_NAME } from '../../functions'

import { getAWSCredentialsFromEKS, AWSCredentials } from '../../../../lib/AWS/sts'

// Mock AWS SDK before any imports to avoid initialization issues
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  PutObjectCommand: jest.fn()
}))

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn(),
  AssumeRoleCommand: jest.fn()
}))

jest.mock('../../../../lib/AWS/sts')

const MockedS3Client = S3Client as unknown as jest.Mock
const MockedPutObjectCommand = PutObjectCommand as unknown as jest.Mock

let testDestination = createTestIntegration(Destination)

beforeEach(() => {
  // Re-Initialize the destination before each test
  // This is done to mitigate a bug where action responses persist into other tests
  testDestination = createTestIntegration(Destination)

  // Mock function to fetch AWS Credentials from STS
  ;(getAWSCredentialsFromEKS as jest.Mock).mockResolvedValue({
    accessKeyId: 'exampleAccessKeyId',
    secretAccessKey: 'exampleSecretAccessKey',
    sessionToken: 'exampleSessionToken'
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
        },
        personas: {
          external_audience_id: 'external_audience_id'
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
      },
      personas: {
        external_audience_id: 'external_audience_id'
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
    },
    personas: {
      external_audience_id: 'external_audience_id'
    }
  }
})

describe('TheTradeDeskCrm.syncAudience', () => {
  it('should fail if batch has less than 1500 and using legacy flow', async () => {
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
        features: { 'actions-the-trade-desk-crm-legacy-flow': true },
        useDefaultMappings: true,
        mapping: {
          name: 'test_audience',
          region: 'US',
          pii_type: 'Email'
        }
      })
    ).rejects.toThrow(`received payload count below The Trade Desk's ingestion minimum. Expected: >=1500 actual: 1`)
  })

  it('should execute legacy flow if flagon override is defined', async () => {
    const dropReferenceId = 'aabbcc5b01-c9c7-4000-9191-000000000000'
    const dropEndpoint = `https://thetradedesk-crm-data.s3.us-east-1.amazonaws.com/data/advertiser/advertiser-id/drop/${dropReferenceId}/pii?X-Amz-Security-Token=token&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=date&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=credentials&X-Amz-Signature=signature&`

    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/crm_data_id`)
      .post(/.*/, { PiiType: 'Email', MergeMode: 'Replace', RetentionEnabled: true })
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

    expect(responses.length).toBe(2)
  })

  it('should use external_id from payload', async () => {
    const dropReferenceId = 'aabbcc5b01-c9c7-4000-9191-000000000000'
    const dropEndpoint = `https://thetradedesk-crm-data.s3.us-east-1.amazonaws.com/data/advertiser/advertiser-id/drop/${dropReferenceId}/pii?X-Amz-Security-Token=token&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=date&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=credentials&X-Amz-Signature=signature&`

    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/personas_test_audience`)
      .post(/.*/, { PiiType: 'Email', MergeMode: 'Replace', RetentionEnabled: true })
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
      features: { 'actions-the-trade-desk-crm-legacy-flow': true, 'ttd-list-action-destination': true },
      useDefaultMappings: true,
      mapping: {
        name: 'test_audience',
        region: 'US',
        pii_type: 'Email'
      }
    })

    expect(responses.length).toBe(2)
  })

  it('should fail if no external_id in payload', async () => {
    const dropReferenceId = 'aabbcc5b01-c9c7-4000-9191-000000000000'
    const dropEndpoint = `https://thetradedesk-crm-data.s3.us-east-1.amazonaws.com/data/advertiser/advertiser-id/drop/${dropReferenceId}/pii?X-Amz-Security-Token=token&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=date&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=credentials&X-Amz-Signature=signature&`

    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/personas_test_audience`)
      .post(/.*/, { PiiType: 'Email', MergeMode: 'Replace', RetentionEnabled: true })
      .reply(200, { ReferenceId: dropReferenceId, Url: dropEndpoint })

    nock(dropEndpoint).put(/.*/).reply(200)

    const newEvent = createTestEvent({
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

    await expect(
      testDestination.testAction('syncAudience', {
        event: newEvent,
        settings: {
          advertiser_id: 'advertiser_id',
          auth_token: 'test_token',
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        features: { 'actions-the-trade-desk-crm-legacy-flow': true, 'ttd-list-action-destination': true },
        useDefaultMappings: true,
        mapping: {
          name: 'test_audience',
          region: 'US',
          pii_type: 'Email'
        }
      })
    ).rejects.toThrow(`No external_id found in payload.`)
  })

  it('should not double hash an email that is already base64 encoded', async () => {
    const dropReferenceId = 'aabbcc5b01-c9c7-4000-9191-000000000000'
    const dropEndpoint = `https://thetradedesk-crm-data.s3.us-east-1.amazonaws.com/data/advertiser/advertiser-id/drop/${dropReferenceId}/pii?X-Amz-Security-Token=token&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=date&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=credentials&X-Amz-Signature=signature&`

    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/crm_data_id`)
      .post(/.*/, { PiiType: 'EmailHashedUnifiedId2', MergeMode: 'Replace', RetentionEnabled: true })
      .reply(200, { ReferenceId: dropReferenceId, Url: dropEndpoint })

    nock(dropEndpoint).put(/.*/).reply(200)

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
            personas: {
              external_audience_id: 'external_audience_id'
            }
          }
        })
      )
    }

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
            email: `yhI0QL7dpdaHFq6DEyKlqKPn2vj7KX91BQeqhniYRvI=`
          },
          personas: {
            external_audience_id: 'external_audience_id'
          }
        }
      })
    )

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
        pii_type: 'EmailHashedUnifiedId2'
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[1].options.body).toMatchInlineSnapshot(`
      "yhI0QL7dpdaHFq6DEyKlqKPn2vj7KX91BQeqhniYRvI=
      "
    `)
  })

  it('should base64 encode a sha256 hashed email', async () => {
    const dropReferenceId = 'aabbcc5b01-c9c7-4000-9191-000000000000'
    const dropEndpoint = `https://thetradedesk-crm-data.s3.us-east-1.amazonaws.com/data/advertiser/advertiser-id/drop/${dropReferenceId}/pii?X-Amz-Security-Token=token&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=date&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=credentials&X-Amz-Signature=signature&`

    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/crm_data_id`)
      .post(/.*/, { PiiType: 'EmailHashedUnifiedId2', MergeMode: 'Replace', RetentionEnabled: true })
      .reply(200, { ReferenceId: dropReferenceId, Url: dropEndpoint })

    nock(dropEndpoint).put(/.*/).reply(200)

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
            personas: {
              external_audience_id: 'external_audience_id'
            }
          }
        })
      )
    }

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
            email: `ca123440bedda5d68716ae831322a5a8a3e7daf8fb297f750507aa86789846f2`
          },
          personas: {
            external_audience_id: 'external_audience_id'
          }
        }
      })
    )

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
        pii_type: 'EmailHashedUnifiedId2'
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[1].options.body).toMatchInlineSnapshot(`
      "yhI0QL7dpdaHFq6DEyKlqKPn2vj7KX91BQeqhniYRvI=
      "
    `)
  })

  describe('AWS Flow (Non-Legacy)', () => {
    it('should use AWS flow when legacy flow flag is not enabled', async () => {
      await testDestination.testBatchAction('syncAudience', {
        events,
        settings: {
          advertiser_id: 'advertiser_id',
          auth_token: 'test_token',
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        // No legacy flow flag - should use AWS flow
        features: {},
        useDefaultMappings: true,
        mapping: {
          name: 'test_audience',
          region: 'US',
          pii_type: 'Email'
        }
      })

      // Verify S3 client send was called (for user data and metadata)
      const mockS3Instance = MockedS3Client.mock.results[MockedS3Client.mock.results.length - 1].value
      expect(mockS3Instance.send).toHaveBeenCalled()

      // Verify PutObjectCommand was used
      expect(MockedPutObjectCommand).toHaveBeenCalled()
    })

    it('should upload user data and metadata to S3 in AWS flow', async () => {
      await testDestination.testBatchAction('syncAudience', {
        events,
        settings: {
          advertiser_id: 'test-advertiser',
          auth_token: 'test-token',
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        features: {}, // AWS flow
        useDefaultMappings: true,
        mapping: {
          name: 'test_audience',
          region: 'US',
          pii_type: 'Email'
        }
      })

      // Verify PutObjectCommand was called for both user data and metadata
      expect(MockedPutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'text/csv',
          Metadata: expect.objectContaining({
            'row-count': expect.any(String)
          })
        })
      )

      expect(MockedPutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'application/json'
        })
      )
    })

    it('should include segmentInternal metadata in AWS flow', async () => {
      await testDestination.testBatchAction('syncAudience', {
        events,
        settings: {
          advertiser_id: 'test-advertiser',
          auth_token: 'test-token',
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        features: {}, // AWS flow
        useDefaultMappings: true,
        mapping: {
          name: 'test_audience',
          region: 'US',
          pii_type: 'Email'
        }
      })

      // Find the metadata upload call
      const metadataCalls = MockedPutObjectCommand.mock.calls.filter((call) => {
        return call[0].ContentType === 'application/json'
      })

      expect(metadataCalls.length).toBeGreaterThan(0)

      // Verify metadata structure
      const metadataCall = metadataCalls[metadataCalls.length - 1][0]
      const metadata = JSON.parse(metadataCall.Body)

      expect(metadata).toMatchObject({
        TTDAuthToken: 'test-token',
        AdvertiserId: 'test-advertiser',
        CrmDataId: expect.any(String),
        DropOptions: {
          PiiType: 'Email',
          MergeMode: 'Replace',
          RetentionEnabled: true
        },
        RequeueCount: 0,
        segmentInternal: expect.objectContaining({
          audienceId: expect.any(String),
          destinationConfigId: expect.any(String),
          subscriptionId: expect.any(String)
        })
      })
    })

    it('should handle EmailHashedUnifiedId2 in AWS flow', async () => {
      const hashedEvents: SegmentEvent[] = []
      for (let index = 1; index <= 100; index++) {
        hashedEvents.push(
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
                email: `test${index}@example.com`
              },
              personas: {
                external_audience_id: 'external_audience_id'
              }
            }
          })
        )
      }

      await testDestination.testBatchAction('syncAudience', {
        events: hashedEvents,
        settings: {
          advertiser_id: 'test-advertiser',
          auth_token: 'test-token',
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        features: {}, // AWS flow
        useDefaultMappings: true,
        mapping: {
          name: 'test_audience',
          region: 'US',
          pii_type: 'EmailHashedUnifiedId2'
        }
      })

      // Verify metadata includes correct PII type
      const metadataCalls = MockedPutObjectCommand.mock.calls.filter((call) => {
        return call[0].ContentType === 'application/json'
      })

      const metadataCall = metadataCalls[metadataCalls.length - 1][0]
      const metadata = JSON.parse(metadataCall.Body)

      expect(metadata.DropOptions.PiiType).toBe('EmailHashedUnifiedId2')
    })
  })
})
