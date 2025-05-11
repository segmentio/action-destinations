import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../../index'
// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'

const testDestination = createTestIntegration(Destination)

const ACCOUNT_ID = '12345'
const EXTERNAL_AUDIENCE_ID = 12345
const DEVICE_ID = '123'

describe('Taboola.syncAudience', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should create a cluster with hashed email and device ID', async () => {
    const event = createTestEvent({
      event: 'Audience Entered',
      type: 'track',
      properties: {
        ios_id: DEVICE_ID
      },
      context: {
        device: {
          advertisingId: '11111'
        },
        traits: {
          email: 'testing@testing.com'
        },
        personas: {
          computation_id: 'true',
          audience_settings: {
            account_id: ACCOUNT_ID
          },
          external_audience_id: EXTERNAL_AUDIENCE_ID
        }
      }
    })

    const expectedBody = {
      operation: 'REMOVE',
      audience_id: EXTERNAL_AUDIENCE_ID,
      identities: [
        {
          cluster: [
            {
              user_id: createHash('sha256').update('testing@testing.com').digest('hex'),
              type: 'EMAIL_ID',
              is_hashed: true
            },
            {
              user_id: '123',
              type: 'DEVICE_ID',
              is_hashed: false
            }
          ]
        }
      ]
    }

    nock('https://backstage.taboola.com')
      .post(`/backstage/api/1.0/${ACCOUNT_ID}/audience_onboarding`, (body) => {
        expect(body).toEqual(expectedBody)
        return true
      })
      .reply(200)

    const responses = await testDestination.testAction('syncAudience', {
      event,
      settings: { client_id: 'TEST_CLIENT_ID', client_secret: 'TEST_CLIENT_SECRET' },
      useDefaultMappings: true,
      mapping: {
        external_audience_id: EXTERNAL_AUDIENCE_ID,
        segment_audience_id: 'computation_id',
        segment_computation_key: 'computation_key',
        segment_computation_action: 'audience',
        enable_batching: false,
        batch_size: 1000
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].content).toEqual('')
  })

  it('should throw an error if no email or device ID is provided', async () => {
    const event = createTestEvent({
      event: 'Audience Entered',
      type: 'track',
      properties: {},
      context: {
        personas: {
          computation_id: 'true',
          audience_settings: {
            account_id: ACCOUNT_ID
          },
          external_audience_id: EXTERNAL_AUDIENCE_ID
        }
      }
    })

    await expect(
      testDestination.testAction('syncAudience', {
        event,
        settings: { client_id: 'TEST_CLIENT_ID', client_secret: 'TEST_CLIENT_SECRET' },
        useDefaultMappings: true,
        mapping: {
          external_audience_id: 'external_audience_id',
          segment_audience_id: 'computation_id',
          segment_computation_key: 'computation_key',
          segment_computation_action: 'audience',
          enable_batching: false,
          batch_size: 1000
        }
      })
    ).rejects.toThrowError(
      new IntegrationError(
        "Bad Request: Either 'Email address' or 'Mobile Device ID' must be provided in the payload.",
        'MISSING_REQUIRED_FIELD',
        400
      )
    )
  })

  it('should throw an error if no audienceSettings are provided', async () => {
    const event = createTestEvent({
      event: 'Audience Entered',
      type: 'track',
      properties: {
        ios_id: DEVICE_ID
      },
      context: {
        device: {
          advertisingId: '11111'
        },
        traits: {
          email: 'testing@testing.com'
        },
        personas: {
          computation_id: 'true',
          external_audience_id: EXTERNAL_AUDIENCE_ID
        }
      }
    })

    await expect(
      testDestination.testAction('syncAudience', {
        event,
        settings: { client_id: 'TEST_CLIENT_ID', client_secret: 'TEST_CLIENT_SECRET' },
        useDefaultMappings: true,
        mapping: {
          external_audience_id: 'external_audience_id',
          segment_audience_id: 'computation_id',
          segment_computation_key: 'computation_key',
          segment_computation_action: 'audience',
          enable_batching: false,
          batch_size: 1000
        }
      })
    ).rejects.toThrowError(new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400))
  })

  it('should handle batch requests', async () => {
    const events = [
      createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          ios_id: DEVICE_ID
        },
        context: {
          device: {
            advertisingId: '11111'
          },
          traits: {
            email: 'testing@testing.com'
          },
          personas: {
            computation_id: 'true',
            audience_settings: {
              account_id: ACCOUNT_ID
            },
            external_audience_id: EXTERNAL_AUDIENCE_ID
          }
        }
      }),
      createTestEvent({
        event: 'Audience Exited',
        type: 'track',
        properties: {
          ios_id: '456'
        },
        context: {
          device: {
            advertisingId: '22222'
          },
          traits: {
            email: 'test2@test.com'
          },
          personas: {
            computation_id: 'false',
            audience_settings: {
              account_id: ACCOUNT_ID
            },
            external_audience_id: EXTERNAL_AUDIENCE_ID
          }
        }
      })
    ]

    const expectedBody = {
      operation: 'REMOVE',
      audience_id: EXTERNAL_AUDIENCE_ID,
      identities: [
        {
          cluster: [
            {
              user_id: createHash('sha256').update('testing@testing.com').digest('hex'),
              type: 'EMAIL_ID',
              is_hashed: true
            },
            {
              user_id: DEVICE_ID,
              type: 'DEVICE_ID',
              is_hashed: false
            }
          ]
        },
        {
          cluster: [
            {
              user_id: createHash('sha256').update('test2@test.com').digest('hex'),
              type: 'EMAIL_ID',
              is_hashed: true
            },
            {
              user_id: '456',
              type: 'DEVICE_ID',
              is_hashed: false
            }
          ]
        }
      ]
    }

    nock('https://backstage.taboola.com')
      .post(`/backstage/api/1.0/${ACCOUNT_ID}/audience_onboarding`, (body) => {
        expect(body).toEqual(expectedBody)
        return true
      })
      .reply(200)

    const responses = await testDestination.testBatchAction('syncAudience', {
      events,
      settings: { client_id: 'TEST_CLIENT_ID', client_secret: 'TEST_CLIENT_SECRET' },
      useDefaultMappings: true,
      mapping: {
        external_audience_id: EXTERNAL_AUDIENCE_ID,
        segment_audience_id: 'computation_id',
        segment_computation_key: 'computation_key',
        segment_computation_action: 'audience',
        enable_batching: true,
        batch_size: 1000
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].content).toEqual('')
  })
})
