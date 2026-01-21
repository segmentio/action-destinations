import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'

// Type for MultiStatus error response node
interface MultiStatusErrorNode {
  status: number
  errortype: string
  errormessage: string
  sent: any
  body: string
  errorreporter: string
}

import { TTD_LEGACY_FLOW_FLAG_NAME } from '../../functions'

import { getAWSCredentialsFromEKS, AWSCredentials } from '../../../../lib/AWS/sts'
jest.mock('../../../../lib/AWS/sts')

// Create a mock send function that can be controlled per test
const mockS3Send = jest.fn()

// Mock AWS S3 client for AWS flow tests
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send
  })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({
    constructor: { name: 'PutObjectCommand' },
    input
  }))
}))

let testDestination = createTestIntegration(Destination)

beforeEach(() => {
  // Re-Initialize the destination before each test
  // This is done to mitigate a bug where action responses persist into other tests
  testDestination = createTestIntegration(Destination)

  // Reset S3 mock to default success behavior
  mockS3Send.mockReset()
  mockS3Send.mockResolvedValue({
    $metadata: { httpStatusCode: 200 }
  })

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
for (let index = 0; index < 1500; index++) {
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
          email: index < 100 ? 'invalid-email' : `testing${index}@testing.com`
        },
        personas: {
          external_audience_id: 'external_audience_id'
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
    },
    personas: {
      external_audience_id: 'external_audience_id'
    }
  }
})

describe('TheTradeDeskCrm.syncAudience legacy flow', () => {
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

    const response = await testDestination.testBatchAction('syncAudience', {
      events: [event],
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

    const multiStatusResponse = testDestination.results?.[0]?.multistatus

    expect(multiStatusResponse).toBeDefined()
    if (multiStatusResponse) {
      expect(multiStatusResponse.length).toBe(1)
      expect(multiStatusResponse[0].status).toBe(400)

      // Type-safe access to error properties
      const errorResponse = multiStatusResponse[0] as MultiStatusErrorNode
      expect(errorResponse.errortype).toBe('PAYLOAD_VALIDATION_FAILED')
      expect(errorResponse.errormessage).toContain('received payload count below')
    }

    // No HTTP requests should be made when validation fails early
    expect(response.length).toBe(0)
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

  it('should mark the payload with invalid email as failed in multistatus response', async () => {
    const dropReferenceId = 'aabbcc5b01-c9c7-4000-9191-000000000000'
    const dropEndpoint = `https://thetradedesk-crm-data.s3.us-east-1.amazonaws.com/data/advertiser/advertiser-id/drop/${dropReferenceId}/pii?X-Amz-Security-Token=token&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=date&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=credentials&X-Amz-Signature=signature&`

    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/personas_test_audience`)
      .post(/.*/, { PiiType: 'Email', MergeMode: 'Replace', RetentionEnabled: true })
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
            email: `invalid-email-address`
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
        pii_type: 'Email'
      }
    })

    expect(responses.length).toBe(2)
    const multiStatusResponse = testDestination.results?.[0]?.multistatus
    expect(multiStatusResponse).toBeDefined()
    if (multiStatusResponse) {
      const length = multiStatusResponse.length
      expect(length).toBe(1501)
      const invalidEmailResponse = multiStatusResponse[length - 1]
      expect(invalidEmailResponse.status).toBe(400)

      // Type-safe access to error properties
      const errorResponse = invalidEmailResponse as MultiStatusErrorNode
      expect(errorResponse.errortype).toBe('PAYLOAD_VALIDATION_FAILED')
      expect(errorResponse.errormessage).toContain('Invalid email format')
    }
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
})

describe('TheTradeDeskCrm.syncAudience AWS Flow', () => {
  it('should execute AWS flow when legacy flag is disabled', async () => {
    const responses = await testDestination.testBatchAction('syncAudience', {
      events,
      settings: {
        advertiser_id: 'advertiser_id',
        auth_token: 'test_token',
        __segment_internal_engage_force_full_sync: true,
        __segment_internal_engage_batch_sync: true
      },
      features: {
        [TTD_LEGACY_FLOW_FLAG_NAME]: false
      },
      useDefaultMappings: true,
      mapping: {
        name: 'test_audience',
        region: 'US',
        pii_type: 'Email'
      }
    })

    // AWS flow returns a MultiStatusResponse, not HTTP responses
    expect(responses).toBeDefined()
  })

  it('should process batch successfully with AWS flow', async () => {
    const responses = await testDestination.testBatchAction('syncAudience', {
      events,
      settings: {
        advertiser_id: 'advertiser_id',
        auth_token: 'test_token',
        __segment_internal_engage_force_full_sync: true,
        __segment_internal_engage_batch_sync: true
      },
      features: {
        [TTD_LEGACY_FLOW_FLAG_NAME]: false
      },
      useDefaultMappings: true,
      mapping: {
        name: 'test_audience',
        region: 'US',
        pii_type: 'Email'
      }
    })

    // Verify the responses exist
    expect(responses.length).toBe(0)

    // Verify multiStatusResponse is populated with success responses
    const multiStatusResponse = testDestination.results?.[0]?.multistatus
    expect(multiStatusResponse?.length).toBe(1500)
    if (multiStatusResponse) {
      // 99 events have invalid emails (index 1-99), rest are valid (1401 + 1 Gmail = 1402)
      const successResponses = multiStatusResponse.filter((r: { status: number }) => r.status === 200)
      expect(successResponses.length).toBe(1400)
    }
  })

  it('should fail with invalid email in AWS flow', async () => {
    await testDestination.testBatchAction('syncAudience', {
      events: events,
      settings: {
        advertiser_id: 'advertiser_id',
        auth_token: 'test_token',
        __segment_internal_engage_force_full_sync: true,
        __segment_internal_engage_batch_sync: true
      },
      features: {
        [TTD_LEGACY_FLOW_FLAG_NAME]: false
      },
      useDefaultMappings: true,
      mapping: {
        name: 'test_audience',
        region: 'US',
        pii_type: 'Email'
      }
    })

    const multiStatusResponse = testDestination.results?.[0]?.multistatus
    expect(multiStatusResponse).toBeDefined()
    if (multiStatusResponse) {
      // The first event with should have error status due to invalid email
      const invalidEmailResponse = multiStatusResponse[0]
      expect(invalidEmailResponse.status).toBe(400)
      const errorResponse = invalidEmailResponse as MultiStatusErrorNode
      expect(errorResponse.errortype).toBe('PAYLOAD_VALIDATION_FAILED')
      expect(errorResponse.errormessage).toContain('Invalid email format')
    }
  })

  it('should mark all payloads as failed when AWS upload fails with default 400 status', async () => {
    // Mock S3 client to throw an error without $metadata
    mockS3Send.mockRejectedValue(new Error('AWS connection failed'))

    await testDestination.testBatchAction('syncAudience', {
      events: events,
      settings: {
        advertiser_id: 'advertiser_id',
        auth_token: 'test_token',
        __segment_internal_engage_force_full_sync: true,
        __segment_internal_engage_batch_sync: true
      },
      features: {
        [TTD_LEGACY_FLOW_FLAG_NAME]: false
      },
      useDefaultMappings: true,
      mapping: {
        name: 'test_audience',
        region: 'US',
        pii_type: 'Email'
      }
    })

    const multiStatusResponse = testDestination.results?.[0]?.multistatus
    expect(multiStatusResponse).toBeDefined()
    if (multiStatusResponse) {
      expect(multiStatusResponse[multiStatusResponse.length - 1].status).toBe(400)
      const errorResponse = multiStatusResponse[multiStatusResponse.length - 1] as MultiStatusErrorNode
      expect(errorResponse.errormessage).toContain('Failed to upload payload to Integrations Outbound Controller')
    }
  })

  it('should use AWS error status code when available in $metadata', async () => {
    // Mock S3 client to throw an error with $metadata.httpStatusCode
    const awsError = new Error('Service Unavailable') as Error & { $metadata?: { httpStatusCode: number } }
    awsError.$metadata = { httpStatusCode: 503 }
    mockS3Send.mockRejectedValue(awsError)

    await testDestination.testBatchAction('syncAudience', {
      events: events,
      settings: {
        advertiser_id: 'advertiser_id',
        auth_token: 'test_token',
        __segment_internal_engage_force_full_sync: true,
        __segment_internal_engage_batch_sync: true
      },
      features: {
        [TTD_LEGACY_FLOW_FLAG_NAME]: false
      },
      useDefaultMappings: true,
      mapping: {
        name: 'test_audience',
        region: 'US',
        pii_type: 'Email'
      }
    })

    const multiStatusResponse = testDestination.results?.[0]?.multistatus
    expect(multiStatusResponse).toBeDefined()
    if (multiStatusResponse) {
      // Should use the 503 status code from AWS error
      expect(multiStatusResponse[multiStatusResponse.length - 1].status).toBe(503)
    }
  })

  it('should preserve already-errored payloads when AWS upload fails', async () => {
    // Mock S3 client to throw an error
    mockS3Send.mockRejectedValue(new Error('AWS connection failed'))

    await testDestination.testBatchAction('syncAudience', {
      events: events,
      settings: {
        advertiser_id: 'advertiser_id',
        auth_token: 'test_token',
        __segment_internal_engage_force_full_sync: true,
        __segment_internal_engage_batch_sync: true
      },
      features: {
        [TTD_LEGACY_FLOW_FLAG_NAME]: false
      },
      useDefaultMappings: true,
      mapping: {
        name: 'test_audience',
        region: 'US',
        pii_type: 'Email'
      }
    })

    const multiStatusResponse = testDestination.results?.[0]?.multistatus
    expect(multiStatusResponse).toBeDefined()
    if (multiStatusResponse) {
      expect(multiStatusResponse.length).toBe(1500)

      // First payload should have PAYLOAD_VALIDATION_FAILED error (from extractUsers)
      const invalidEmailError = multiStatusResponse[0] as MultiStatusErrorNode
      expect(invalidEmailError.status).toBe(400)
      expect(invalidEmailError.errortype).toBe('PAYLOAD_VALIDATION_FAILED')
      expect(invalidEmailError.errormessage).toContain('Invalid email format')

      // Second payload should have AWS upload failure error
      const awsFailureError = multiStatusResponse[multiStatusResponse.length - 1] as MultiStatusErrorNode
      expect(awsFailureError.status).toBe(400)
      expect(awsFailureError.errormessage).toContain('Failed to upload payload to Integrations Outbound Controller')
    }
  })
})
