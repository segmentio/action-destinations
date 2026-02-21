import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'

const testDestination = createTestIntegration(Definition)

const settings = {
  api_key: 'test_api_key',
  secret_key: 'test_secret_key',
  app_id: 'test_app_id',
  owner_email: 'owner@example.com',
  endpoint: 'north_america'
}

describe('Amplitude Cohorts - syncAudience', () => {
  describe('perform', () => {
    it('should add user to cohort', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user123',
        traits: {
          test_audience: true
        },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: 'cohort_123',
            audience_settings: {
              id_type: 'BY_USER_ID'
            }
          }
        }
      })

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', {
          cohort_id: 'cohort_123',
          skip_invalid_ids: true,
          memberships: [
            {
              ids: ['user123'],
              id_type: 'BY_USER_ID',
              operation: 'ADD'
            }
          ]
        })
        .reply(200, {
          cohort_id: 'cohort_123',
          memberships_result: [
            {
              skipped_ids: [],
              operation: 'ADD'
            }
          ]
        })

      const responses = await testDestination.testAction('syncAudience', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should remove user from cohort', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user456',
        traits: {
          test_audience: false
        },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: 'cohort_123',
            audience_settings: {
              id_type: 'BY_USER_ID'
            }
          }
        }
      })

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', {
          cohort_id: 'cohort_123',
          skip_invalid_ids: true,
          memberships: [
            {
              ids: ['user456'],
              id_type: 'BY_USER_ID',
              operation: 'REMOVE'
            }
          ]
        })
        .reply(200, {
          cohort_id: 'cohort_123',
          memberships_result: [
            {
              skipped_ids: [],
              operation: 'REMOVE'
            }
          ]
        })

      const responses = await testDestination.testAction('syncAudience', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should work with amplitude_id', async () => {
      const event = createTestEvent({
        type: 'identify',
        traits: {
          test_audience: true
        },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: 'cohort_456',
            audience_settings: {
              id_type: 'BY_AMP_ID'
            }
          }
        }
      })

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', {
          cohort_id: 'cohort_456',
          skip_invalid_ids: true,
          memberships: [
            {
              ids: ['amp789'],
              id_type: 'BY_AMP_ID',
              operation: 'ADD'
            }
          ]
        })
        .reply(200, {
          cohort_id: 'cohort_456',
          memberships_result: [
            {
              skipped_ids: [],
              operation: 'ADD'
            }
          ]
        })

      const responses = await testDestination.testAction('syncAudience', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          amplitude_id: 'amp789'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should throw error when id_type is missing in audienceSettings', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user123',
        traits: {
          test_audience: true
        },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: 'cohort_123',
            audience_settings: {}
          }
        }
      })

      await expect(
        testDestination.testAction('syncAudience', {
          event,
          settings,
          useDefaultMappings: true
        })
      ).rejects.toThrowError('ID Type must be specified in Audience Settings')
    })

    it('should throw error when required id is missing', async () => {
      const event = createTestEvent({
        type: 'identify',
        // no userId
        traits: {
          test_audience: true
        },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: 'cohort_123',
            audience_settings: {
              id_type: 'BY_USER_ID'
            }
          }
        }
      })

      await expect(
        testDestination.testAction('syncAudience', {
          event,
          settings,
          useDefaultMappings: true,
          mapping: {
            user_id: undefined
          }
        })
      ).rejects.toThrowError("No User Identifier of type User ID found in payload. Each payload must have a unique ID for the specified ID Type.")
    })
  })

  describe('performBatch', () => {
    it('should add and remove users in single batch', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          traits: {
            test_audience: true
          },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_batch',
              audience_settings: {
                id_type: 'BY_USER_ID'
              }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          traits: {
            test_audience: true
          },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_batch',
              audience_settings: {
                id_type: 'BY_USER_ID'
              }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user3',
          traits: {
            test_audience: false
          },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_batch',
              audience_settings: {
                id_type: 'BY_USER_ID'
              }
            }
          }
        })
      ]

      // Nock for ADD operation
      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', {
          cohort_id: 'cohort_batch',
          skip_invalid_ids: true,
          memberships: [
            {
              ids: ['user1', 'user2'],
              id_type: 'BY_USER_ID',
              operation: 'ADD'
            }
          ]
        })
        .reply(200, {
          cohort_id: 'cohort_batch',
          memberships_result: [
            {
              skipped_ids: [],
              operation: 'ADD'
            }
          ]
        })

      // Nock for REMOVE operation
      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', {
          cohort_id: 'cohort_batch',
          skip_invalid_ids: true,
          memberships: [
            {
              ids: ['user3'],
              id_type: 'BY_USER_ID',
              operation: 'REMOVE'
            }
          ]
        })
        .reply(200, {
          cohort_id: 'cohort_batch',
          memberships_result: [
            {
              skipped_ids: [],
              operation: 'REMOVE'
            }
          ]
        })

      const responses = await testDestination.testBatchAction('syncAudience', {
        events,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
    })

    it('should handle skipped IDs from Amplitude API', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'valid_user',
          traits: {
            test_audience: true
          },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_skip',
              audience_settings: {
                id_type: 'BY_USER_ID'
              }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'invalid_user',
          traits: {
            test_audience: true
          },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_skip',
              audience_settings: {
                id_type: 'BY_USER_ID'
              }
            }
          }
        })
      ]

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', {
          cohort_id: 'cohort_skip',
          skip_invalid_ids: true,
          memberships: [
            {
              ids: ['valid_user', 'invalid_user'],
              id_type: 'BY_USER_ID',
              operation: 'ADD'
            }
          ]
        })
        .reply(200, {
          cohort_id: 'cohort_skip',
          memberships_result: [
            {
              skipped_ids: ['invalid_user'],
              operation: 'ADD'
            }
          ]
        })

      const responses = await testDestination.testBatchAction('syncAudience', {
        events,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send to Europe endpoint when configured', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'eu_user',
        traits: {
          test_audience: true
        },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: 'cohort_eu',
            audience_settings: {
              id_type: 'BY_USER_ID'
            }
          }
        }
      })

      nock('https://analytics.eu.amplitude.com')
        .post('/api/3/cohorts/membership', {
          cohort_id: 'cohort_eu',
          skip_invalid_ids: true,
          memberships: [
            {
              ids: ['eu_user'],
              id_type: 'BY_USER_ID',
              operation: 'ADD'
            }
          ]
        })
        .reply(200, {
          cohort_id: 'cohort_eu',
          memberships_result: [
            {
              skipped_ids: [],
              operation: 'ADD'
            }
          ]
        })

      const responses = await testDestination.testAction('syncAudience', {
        event,
        settings: {
          ...settings,
          endpoint: 'europe'
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should handle track events with properties', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: 'track_user',
        properties: {
          test_audience: true
        },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: 'cohort_track',
            audience_settings: {
              id_type: 'BY_USER_ID'
            }
          }
        }
      })

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership')
        .reply(200, {
          cohort_id: 'cohort_track',
          memberships_result: [
            {
              skipped_ids: [],
              operation: 'ADD'
            }
          ]
        })

      const responses = await testDestination.testAction('syncAudience', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
