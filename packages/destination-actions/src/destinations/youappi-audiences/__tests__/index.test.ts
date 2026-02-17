import nock from 'nock'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('YouAppi Audiences', () => {
  describe('sync action', () => {
    beforeEach(() => {
      nock.cleanAll()
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should sync audience data with IDFA and GAID for add operation', async () => {
      const expectedRequestBody = {
        api_key: 'test-api-key-12345',
        device_identities: [
          { type: 'IDFA', value: 'AEBE52E7-03EE-455A-B3C4-E57283966239' },
          { type: 'GAID', value: '38400000-8cf0-11bd-b23e-10b96e40000d' }
        ],
        audiences: [
          {
            audience_id: 551320287,
            audience_name: 'High Value Customers',
            action: 'add'
          }
        ]
      }

      nock('https://audiences.youappi.com')
        .post('/advertiser_name/AudienceMembership', expectedRequestBody)
        .reply(200, { success: true })

      const settings = {
        api_key: 'test-api-key-12345'
      }

      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          idfa: 'AEBE52E7-03EE-455A-B3C4-E57283966239',
          gaid: '38400000-8cf0-11bd-b23e-10b96e40000d',
          email: 'user@example.com',
          'High Value Customers': true
        },
        context: {
          personas: {
            computation_id: 'aud_2bXXXXXXXXXXXXXXXXXXXX',
            computation_key: 'High Value Customers'
          }
        }
      })

      const mapping = {
        idfa: {
          '@path': '$.traits.idfa'
        },
        gaid: {
          '@path': '$.traits.gaid'
        },
        audience_name: {
          '@path': '$.context.personas.computation_key'
        },
        audience_id: {
          '@path': '$.context.personas.computation_id'
        },
        traits_or_props: {
          '@path': '$.traits'
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testAction('sync', {
        event,
        mapping,
        settings
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe(200)

      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody).toEqual(expectedRequestBody)
    })

    it('should sync audience data for remove operation', async () => {
      const expectedRequestBody = {
        api_key: 'test-api-key-12345',
        device_identities: [
          { type: 'IDFA', value: 'FFFE52E7-03EE-455A-B3C4-E57283966239' },
          { type: 'GAID', value: '99900000-8cf0-11bd-b23e-10b96e40000d' }
        ],
        audiences: [
          {
            audience_id: 1308640319,
            audience_name: 'Premium Subscribers',
            action: 'remove'
          }
        ]
      }

      nock('https://audiences.youappi.com')
        .post('/advertiser_name/AudienceMembership', expectedRequestBody)
        .reply(200, { success: true })

      const settings = {
        api_key: 'test-api-key-12345'
      }

      const event = createTestEvent({
        type: 'identify',
        userId: 'user-456',
        traits: {
          idfa: 'FFFE52E7-03EE-455A-B3C4-E57283966239',
          gaid: '99900000-8cf0-11bd-b23e-10b96e40000d',
          email: 'inactive@example.com',
          'Premium Subscribers': false
        },
        context: {
          personas: {
            computation_id: 'aud_3cYYYYYYYYYYYYYYYYYYYY',
            computation_key: 'Premium Subscribers'
          }
        }
      })

      const mapping = {
        idfa: {
          '@path': '$.traits.idfa'
        },
        gaid: {
          '@path': '$.traits.gaid'
        },
        audience_name: {
          '@path': '$.context.personas.computation_key'
        },
        audience_id: {
          '@path': '$.context.personas.computation_id'
        },
        traits_or_props: {
          '@path': '$.traits'
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testAction('sync', {
        event,
        mapping,
        settings
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe(200)

      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody).toEqual(expectedRequestBody)
    })

    it('should handle batch sync with multiple add operations', async () => {
      const expectedRequestBody = {
        api_key: 'test-api-key-12345',
        device_identities: [
          { type: 'IDFA', value: 'A1234567-89AB-CDEF-0123-456789ABCDEF' },
          { type: 'GAID', value: '11111111-1111-1111-1111-111111111111' },
          { type: 'IDFA', value: 'B2345678-89AB-CDEF-0123-456789ABCDEF' },
          { type: 'GAID', value: '22222222-2222-2222-2222-222222222222' },
          { type: 'IDFA', value: 'C3456789-89AB-CDEF-0123-456789ABCDEF' },
          { type: 'GAID', value: '33333333-3333-3333-3333-333333333333' }
        ],
        audiences: [
          {
            audience_id: -646589252,
            audience_name: 'Mobile App Users',
            action: 'add'
          }
        ]
      }

      nock('https://audiences.youappi.com')
        .post('/advertiser_name/AudienceMembership', expectedRequestBody)
        .reply(200, { success: true })

      const settings = {
        api_key: 'test-api-key-12345'
      }

      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-001',
          traits: {
            idfa: 'A1234567-89AB-CDEF-0123-456789ABCDEF',
            gaid: '11111111-1111-1111-1111-111111111111',
            email: 'user001@example.com',
            'Mobile App Users': true
          },
          context: {
            personas: {
              computation_id: 'aud_mobile_app_users',
              computation_key: 'Mobile App Users'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-002',
          traits: {
            idfa: 'B2345678-89AB-CDEF-0123-456789ABCDEF',
            gaid: '22222222-2222-2222-2222-222222222222',
            email: 'user002@example.com',
            'Mobile App Users': true
          },
          context: {
            personas: {
              computation_id: 'aud_mobile_app_users',
              computation_key: 'Mobile App Users'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-003',
          traits: {
            idfa: 'C3456789-89AB-CDEF-0123-456789ABCDEF',
            gaid: '33333333-3333-3333-3333-333333333333',
            email: 'user003@example.com',
            'Mobile App Users': true
          },
          context: {
            personas: {
              computation_id: 'aud_mobile_app_users',
              computation_key: 'Mobile App Users'
            }
          }
        })
      ]

      const mapping = {
        idfa: {
          '@path': '$.traits.idfa'
        },
        gaid: {
          '@path': '$.traits.gaid'
        },
        audience_name: {
          '@path': '$.context.personas.computation_key'
        },
        audience_id: {
          '@path': '$.context.personas.computation_id'
        },
        traits_or_props: {
          '@path': '$.traits'
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testBatchAction('sync', {
        events,
        mapping,
        settings
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe(200)

      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody).toEqual(expectedRequestBody)
    })

    it('should handle batch sync with both add and remove operations', async () => {
      const expectedAddRequestBody = {
        api_key: 'test-api-key-12345',
        device_identities: [
          { type: 'IDFA', value: 'D4567890-89AB-CDEF-0123-456789ABCDEF' },
          { type: 'GAID', value: '44444444-4444-4444-4444-444444444444' },
          { type: 'IDFA', value: 'F6789012-89AB-CDEF-0123-456789ABCDEF' },
          { type: 'GAID', value: '66666666-6666-6666-6666-666666666666' }
        ],
        audiences: [
          {
            audience_id: -514092063,
            audience_name: 'Active Users',
            action: 'add'
          }
        ]
      }

      const expectedRemoveRequestBody = {
        api_key: 'test-api-key-12345',
        device_identities: [
          { type: 'IDFA', value: 'E5678901-89AB-CDEF-0123-456789ABCDEF' },
          { type: 'GAID', value: '55555555-5555-5555-5555-555555555555' }
        ],
        audiences: [
          {
            audience_id: -514092063,
            audience_name: 'Active Users',
            action: 'remove'
          }
        ]
      }

      nock('https://audiences.youappi.com')
        .post('/advertiser_name/AudienceMembership', expectedAddRequestBody)
        .reply(200, { success: true })

      nock('https://audiences.youappi.com')
        .post('/advertiser_name/AudienceMembership', expectedRemoveRequestBody)
        .reply(200, { success: true })

      const settings = {
        api_key: 'test-api-key-12345'
      }

      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'active-user-1',
          traits: {
            idfa: 'D4567890-89AB-CDEF-0123-456789ABCDEF',
            gaid: '44444444-4444-4444-4444-444444444444',
            email: 'active1@example.com',
            'Active Users': true,
            last_active: '2024-01-15'
          },
          context: {
            personas: {
              computation_id: 'aud_active_users_2024',
              computation_key: 'Active Users'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'churned-user',
          traits: {
            idfa: 'E5678901-89AB-CDEF-0123-456789ABCDEF',
            gaid: '55555555-5555-5555-5555-555555555555',
            email: 'churned@example.com',
            'Active Users': false,
            last_active: '2023-06-01'
          },
          context: {
            personas: {
              computation_id: 'aud_active_users_2024',
              computation_key: 'Active Users'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'active-user-2',
          traits: {
            idfa: 'F6789012-89AB-CDEF-0123-456789ABCDEF',
            gaid: '66666666-6666-6666-6666-666666666666',
            email: 'active2@example.com',
            'Active Users': true,
            last_active: '2024-01-20'
          },
          context: {
            personas: {
              computation_id: 'aud_active_users_2024',
              computation_key: 'Active Users'
            }
          }
        })
      ]

      const mapping = {
        idfa: {
          '@path': '$.traits.idfa'
        },
        gaid: {
          '@path': '$.traits.gaid'
        },
        audience_name: {
          '@path': '$.context.personas.computation_key'
        },
        audience_id: {
          '@path': '$.context.personas.computation_id'
        },
        traits_or_props: {
          '@path': '$.traits'
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testBatchAction('sync', {
        events,
        mapping,
        settings
      })

      expect(responses).toHaveLength(2)

      const addResponse = responses.find(r => {
        const body = JSON.parse(r.options.body as string)
        return body.audiences[0].action === 'add'
      })
      expect(addResponse).toBeDefined()
      expect(addResponse!.status).toBe(200)

      const addBody = JSON.parse(addResponse!.options.body as string)
      expect(addBody).toEqual(expectedAddRequestBody)

      const removeResponse = responses.find(r => {
        const body = JSON.parse(r.options.body as string)
        return body.audiences[0].action === 'remove'
      })
      expect(removeResponse).toBeDefined()
      expect(removeResponse!.status).toBe(200)

      const removeBody = JSON.parse(removeResponse!.options.body as string)
      expect(removeBody).toEqual(expectedRemoveRequestBody)
    })

    it('should handle API errors gracefully', async () => {
      const expectedRequestBody = {
        api_key: 'invalid-api-key',
        device_identities: [
          { type: 'IDFA', value: 'AAAA0000-89AB-CDEF-0123-456789ABCDEF' },
          { type: 'GAID', value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }
        ],
        audiences: [
          {
            audience_id: 1406177546,
            audience_name: 'Test Audience',
            action: 'add'
          }
        ]
      }

      nock('https://audiences.youappi.com')
        .post('/advertiser_name/AudienceMembership', expectedRequestBody)
        .reply(401, { error: 'Unauthorized', message: 'Invalid API key' })

      const settings = {
        api_key: 'invalid-api-key'
      }

      const event = createTestEvent({
        type: 'identify',
        userId: 'user-error',
        traits: {
          idfa: 'AAAA0000-89AB-CDEF-0123-456789ABCDEF',
          gaid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          email: 'error@example.com',
          'Test Audience': true
        },
        context: {
          personas: {
            computation_id: 'aud_test_error',
            computation_key: 'Test Audience'
          }
        }
      })

      const mapping = {
        idfa: {
          '@path': '$.traits.idfa'
        },
        gaid: {
          '@path': '$.traits.gaid'
        },
        audience_name: {
          '@path': '$.context.personas.computation_key'
        },
        audience_id: {
          '@path': '$.context.personas.computation_id'
        },
        traits_or_props: {
          '@path': '$.traits'
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      await expect(
        testDestination.testAction('sync', {
          event,
          mapping,
          settings
        })
      ).rejects.toThrowError()
    })

    it('should handle batch API errors gracefully in batch mode', async () => {
      nock.cleanAll()

      const expectedRequestBody = {
        api_key: 'test-api-key-batch-error',
        device_identities: [
          { type: 'IDFA', value: 'BBBB0000-89AB-CDEF-0123-456789ABCDEF' },
          { type: 'GAID', value: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
          { type: 'IDFA', value: 'CCCC0000-89AB-CDEF-0123-456789ABCDEF' },
          { type: 'GAID', value: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }
        ],
        audiences: [
          {
            audience_id: -919345306,
            audience_name: 'Batch Test Audience',
            action: 'add'
          }
        ]
      }

      nock('https://audiences.youappi.com')
        .post('/advertiser_name/AudienceMembership', expectedRequestBody)
        .reply(503, { error: 'Service Unavailable' })

      const settings = {
        api_key: 'test-api-key-batch-error'
      }

      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'batch-user-1',
          traits: {
            idfa: 'BBBB0000-89AB-CDEF-0123-456789ABCDEF',
            gaid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            email: 'batch1@example.com',
            'Batch Test Audience': true
          },
          context: {
            personas: {
              computation_id: 'aud_batch_test',
              computation_key: 'Batch Test Audience'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'batch-user-2',
          traits: {
            idfa: 'CCCC0000-89AB-CDEF-0123-456789ABCDEF',
            gaid: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            email: 'batch2@example.com',
            'Batch Test Audience': true
          },
          context: {
            personas: {
              computation_id: 'aud_batch_test',
              computation_key: 'Batch Test Audience'
            }
          }
        })
      ]

      const mapping = {
        idfa: {
          '@path': '$.traits.idfa'
        },
        gaid: {
          '@path': '$.traits.gaid'
        },
        audience_name: {
          '@path': '$.context.personas.computation_key'
        },
        audience_id: {
          '@path': '$.context.personas.computation_id'
        },
        traits_or_props: {
          '@path': '$.traits'
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testBatchAction('sync', {
        events,
        mapping,
        settings
      })

      expect(responses.length).toBeGreaterThanOrEqual(1)
      const hasError = responses.some(r => r.status >= 400)
      expect(hasError).toBe(true)
    })
  })
})
