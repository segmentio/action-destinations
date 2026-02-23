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

  describe('executeBatch', () => {
    const mapping = {
      user_id: { '@path': '$.userId' },
      engage_fields: {
        segment_computation_class: { '@path': '$.context.personas.computation_class' },
        traits_or_properties: {
          '@if': {
            exists: { '@path': '$.traits' },
            then: { '@path': '$.traits' },
            else: { '@path': '$.properties' }
          }
        },
        segment_audience_key: { '@path': '$.context.personas.computation_key' },
        segment_external_audience_id: { '@path': '$.context.personas.external_audience_id' }
      },
      batch_size: 100
    }

    beforeEach(() => {
      nock.cleanAll()
    })

    it('should add multiple users to cohort and verify full request JSON', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        })
      ]

      const expectedRequestJson = {
        cohort_id: 'cohort_123',
        skip_invalid_ids: true,
        memberships: [{ ids: ['user1', 'user2'], id_type: 'BY_USER_ID', operation: 'ADD' }]
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', expectedRequestJson)
        .reply(200, {
          cohort_id: 'cohort_123',
          memberships_result: [{ skipped_ids: [], operation: 'ADD' }]
        })

      const responses = await testDestination.executeBatch('syncAudience', { events, settings, mapping })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['user1'], id_type: 'BY_USER_ID', operation: 'ADD' }] },
        body: {
          user_id: 'user1',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: true },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_123'
          },
          batch_size: 100
        }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['user2'], id_type: 'BY_USER_ID', operation: 'ADD' }] },
        body: {
          user_id: 'user2',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: true },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_123'
          },
          batch_size: 100
        }
      })
    })

    it('should remove multiple users from cohort and verify full request JSON', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          traits: { test_audience: false },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          traits: { test_audience: false },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        })
      ]

      const expectedRequestJson = {
        cohort_id: 'cohort_123',
        skip_invalid_ids: true,
        memberships: [{ ids: ['user1', 'user2'], id_type: 'BY_USER_ID', operation: 'REMOVE' }]
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', expectedRequestJson)
        .reply(200, {
          cohort_id: 'cohort_123',
          memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
        })

      const responses = await testDestination.executeBatch('syncAudience', { events, settings, mapping })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['user1'], id_type: 'BY_USER_ID', operation: 'REMOVE' }] },
        body: {
          user_id: 'user1',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: false },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_123'
          },
          batch_size: 100
        }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['user2'], id_type: 'BY_USER_ID', operation: 'REMOVE' }] },
        body: {
          user_id: 'user2',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: false },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_123'
          },
          batch_size: 100
        }
      })
    })

    it('should add and remove users in the same batch with two separate requests', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'add_user1',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'add_user2',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'remove_user1',
          traits: { test_audience: false },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        })
      ]

      const expectedAddJson = {
        cohort_id: 'cohort_123',
        skip_invalid_ids: true,
        memberships: [{ ids: ['add_user1', 'add_user2'], id_type: 'BY_USER_ID', operation: 'ADD' }]
      }

      const expectedRemoveJson = {
        cohort_id: 'cohort_123',
        skip_invalid_ids: true,
        memberships: [{ ids: ['remove_user1'], id_type: 'BY_USER_ID', operation: 'REMOVE' }]
      }

      nock('https://amplitude.com').post('/api/3/cohorts/membership', expectedAddJson).reply(200, {
        cohort_id: 'cohort_123',
        memberships_result: [{ skipped_ids: [], operation: 'ADD' }]
      })

      nock('https://amplitude.com').post('/api/3/cohorts/membership', expectedRemoveJson).reply(200, {
        cohort_id: 'cohort_123',
        memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
      })

      const responses = await testDestination.executeBatch('syncAudience', { events, settings, mapping })

      expect(responses.length).toBe(3)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { ...expectedAddJson, memberships: [{ ids: ['add_user1'], id_type: 'BY_USER_ID', operation: 'ADD' }] },
        body: {
          user_id: 'add_user1',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: true },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_123'
          },
          batch_size: 100
        }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { ...expectedAddJson, memberships: [{ ids: ['add_user2'], id_type: 'BY_USER_ID', operation: 'ADD' }] },
        body: {
          user_id: 'add_user2',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: true },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_123'
          },
          batch_size: 100
        }
      })
      expect(responses[2]).toMatchObject({
        status: 200,
        sent: { ...expectedRemoveJson, memberships: [{ ids: ['remove_user1'], id_type: 'BY_USER_ID', operation: 'REMOVE' }] },
        body: {
          user_id: 'remove_user1',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: false },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_123'
          },
          batch_size: 100
        }
      })
    })

    it('should add users using BY_AMP_ID and verify full request JSON', async () => {
      const ampMapping = {
        ...mapping,
        amplitude_id: { '@path': '$.properties.amplitude_id' }
      }

      const events = [
        createTestEvent({
          type: 'identify',
          traits: { test_audience: true },
          properties: { amplitude_id: 'amp_id_1' },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_amp',
              audience_settings: { id_type: 'BY_AMP_ID' }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          traits: { test_audience: true },
          properties: { amplitude_id: 'amp_id_2' },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_amp',
              audience_settings: { id_type: 'BY_AMP_ID' }
            }
          }
        })
      ]

      const expectedRequestJson = {
        cohort_id: 'cohort_amp',
        skip_invalid_ids: true,
        memberships: [{ ids: ['amp_id_1', 'amp_id_2'], id_type: 'BY_AMP_ID', operation: 'ADD' }]
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', expectedRequestJson)
        .reply(200, {
          cohort_id: 'cohort_amp',
          memberships_result: [{ skipped_ids: [], operation: 'ADD' }]
        })

      const responses = await testDestination.executeBatch('syncAudience', { events, settings, mapping: ampMapping })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['amp_id_1'], id_type: 'BY_AMP_ID', operation: 'ADD' }] },
        body: {
          amplitude_id: 'amp_id_1',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: true },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_amp'
          },
          batch_size: 100
        }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['amp_id_2'], id_type: 'BY_AMP_ID', operation: 'ADD' }] },
        body: {
          amplitude_id: 'amp_id_2',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: true },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_amp'
          },
          batch_size: 100
        }
      })
    })

    it('should send to Europe endpoint and verify full request JSON', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'eu_user1',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_eu',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'eu_user2',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_eu',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        })
      ]

      const expectedRequestJson = {
        cohort_id: 'cohort_eu',
        skip_invalid_ids: true,
        memberships: [{ ids: ['eu_user1', 'eu_user2'], id_type: 'BY_USER_ID', operation: 'ADD' }]
      }

      nock('https://analytics.eu.amplitude.com')
        .post('/api/3/cohorts/membership', expectedRequestJson)
        .reply(200, {
          cohort_id: 'cohort_eu',
          memberships_result: [{ skipped_ids: [], operation: 'ADD' }]
        })

      const euSettings = { ...settings, endpoint: 'europe' }
      const responses = await testDestination.executeBatch('syncAudience', { events, settings: euSettings, mapping })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['eu_user1'], id_type: 'BY_USER_ID', operation: 'ADD' }] },
        body: {
          user_id: 'eu_user1',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: true },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_eu'
          },
          batch_size: 100
        }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['eu_user2'], id_type: 'BY_USER_ID', operation: 'ADD' }] },
        body: {
          user_id: 'eu_user2',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: true },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_eu'
          },
          batch_size: 100
        }
      })
    })

    it('should mark skipped IDs returned by Amplitude as errors', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'valid_user',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'skipped_user',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        })
      ]

      const expectedRequestJson = {
        cohort_id: 'cohort_123',
        skip_invalid_ids: true,
        memberships: [{ ids: ['valid_user', 'skipped_user'], id_type: 'BY_USER_ID', operation: 'ADD' }]
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', expectedRequestJson)
        .reply(200, {
          cohort_id: 'cohort_123',
          memberships_result: [{ skipped_ids: ['skipped_user'], operation: 'ADD' }]
        })

      const responses = await testDestination.executeBatch('syncAudience', { events, settings, mapping })

      const expectedSkippedSent = {
        cohort_id: 'cohort_123',
        skip_invalid_ids: true,
        memberships: [{ ids: ['skipped_user'], id_type: 'BY_USER_ID', operation: 'ADD' }]
      }

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['valid_user'], id_type: 'BY_USER_ID', operation: 'ADD' }] },
        body: {
          user_id: 'valid_user',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: true },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_123'
          },
          batch_size: 100
        }
      })
      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'UNKNOWN_ERROR',
        errormessage: 'The user with User ID skipped_user was invalid and was not processed in the cohort update.',
        sent: expectedSkippedSent
      })
    })

    it('should mark duplicate user IDs as errors and only send unique IDs to Amplitude', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        })
      ]

      // Only unique IDs should be sent
      const expectedRequestJson = {
        cohort_id: 'cohort_123',
        skip_invalid_ids: true,
        memberships: [{ ids: ['user1', 'user2'], id_type: 'BY_USER_ID', operation: 'ADD' }]
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', expectedRequestJson)
        .reply(200, {
          cohort_id: 'cohort_123',
          memberships_result: [{ skipped_ids: [], operation: 'ADD' }]
        })

      const responses = await testDestination.executeBatch('syncAudience', { events, settings, mapping })

      expect(responses.length).toBe(3)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['user1'], id_type: 'BY_USER_ID', operation: 'ADD' }] },
        body: {
          user_id: 'user1',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: true },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_123'
          },
          batch_size: 100
        }
      })
      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage:
          'Duplicate ID user1 of type User ID found in payload batch. The duplicate payload has been rejected. Each payload must have a unique ID for the specified ID Type.'
      })
      expect(responses[2]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['user2'], id_type: 'BY_USER_ID', operation: 'ADD' }] },
        body: {
          user_id: 'user2',
          engage_fields: {
            segment_computation_class: 'audience',
            traits_or_properties: { test_audience: true },
            segment_audience_key: 'test_audience',
            segment_external_audience_id: 'cohort_123'
          },
          batch_size: 100
        }
      })
    })

    it('should mark payloads with missing user IDs as errors', async () => {
      // Map user_id from a traits field so we can control which event has it
      const traitsMappedMapping = { ...mapping, user_id: { '@path': '$.traits.explicit_user_id' } }

      const events = [
        createTestEvent({
          type: 'identify',
          traits: { test_audience: true, explicit_user_id: 'user1' },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          traits: { test_audience: true }, // no explicit_user_id
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        })
      ]

      // Only user1 should be sent; the event with no explicit_user_id is an error
      const expectedRequestJson = {
        cohort_id: 'cohort_123',
        skip_invalid_ids: true,
        memberships: [{ ids: ['user1'], id_type: 'BY_USER_ID', operation: 'ADD' }]
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', expectedRequestJson)
        .reply(200, {
          cohort_id: 'cohort_123',
          memberships_result: [{ skipped_ids: [], operation: 'ADD' }]
        })

      const responses = await testDestination.executeBatch('syncAudience', {
        events,
        settings,
        mapping: traitsMappedMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { ...expectedRequestJson, memberships: [{ ids: ['user1'], id_type: 'BY_USER_ID', operation: 'ADD' }] },
        body: {
          batch_size: 100,
          engage_fields: {
            segment_audience_key: 'test_audience',
            segment_computation_class: 'audience',
            segment_external_audience_id: 'cohort_123',
            traits_or_properties: {
              explicit_user_id: 'user1',
              test_audience: true
            }
          },
          user_id: 'user1'
        }
      })

      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage:
          'No User Identifier of type User ID found in payload. Each payload must have a unique ID for the specified ID Type.'
      })
    })

    it('should mark all payloads as errors when id_type is missing from audience settings', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: {}
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: {}
            }
          }
        })
      ]

      const expectedError = {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'ID Type must be specified in Audience Settings.'
      }

      const responses = await testDestination.executeBatch('syncAudience', { events, settings, mapping })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject(expectedError)
      expect(responses[1]).toMatchObject(expectedError)
    })

    it('should mark all payloads as errors when the Amplitude API returns an error', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          traits: { test_audience: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: 'test_audience',
              external_audience_id: 'cohort_123',
              audience_settings: { id_type: 'BY_USER_ID' }
            }
          }
        })
      ]

      const expectedRequestJson = {
        cohort_id: 'cohort_123',
        skip_invalid_ids: true,
        memberships: [{ ids: ['user1', 'user2'], id_type: 'BY_USER_ID', operation: 'ADD' }]
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', expectedRequestJson)
        .reply(400, {
          error: {
            error: 'BAD_REQUEST',
            message: 'Invalid cohort ID'
          }
        })

      const responses = await testDestination.executeBatch('syncAudience', { events, settings, mapping })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 400,
        errormessage: expect.stringContaining('Invalid cohort ID')
      })
      expect(responses[1]).toMatchObject({
        status: 400,
        errormessage: expect.stringContaining('Invalid cohort ID')
      })
    })
  })
})
