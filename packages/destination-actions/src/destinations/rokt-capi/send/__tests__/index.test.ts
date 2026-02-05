import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../../index'

const testDestination = createTestIntegration(destination)

describe('RoktCapi.send', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
  })

  describe('Single Event Tests', () => {
    it.skip('should send a basic conversion event with required fields', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        messageId: 'msg-001',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          order_id: 'order-123',
          revenue: 99.99,
          currency: 'USD'
        },
        context: {
          traits: {
            email: 'test@example.com'
          },
          ip: '192.168.1.1'
        },
        userId: 'user-123'
      })

      const expectedRoktPayload = {
        environment: 'production',
        device_info: {},
        user_attributes: {},
        user_identities: {
          email: 'test@example.com',
          customerid: 'user-123'
        },
        events: [
          {
            event_type: 'custom_event',
            data: {
              custom_event_type: 'transaction',
              source_message_id: 'msg-001',
              timestamp_unixtime_ms: 1705579200000,
              event_name: 'conversion',
              custom_attributes: {
                conversiontype: 'Order Completed',
                confirmationref: 'order-123',
                amount: 99.99,
                currency: 'USD'
              }
            }
          }
        ],
        ip: '192.168.1.1'
      }

      nock('https://inbound.mparticle.com').post('/s2s/v2/events', expectedRoktPayload).reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it.skip('should map rtid from integrations.Rokt Conversions API.rtid', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        messageId: 'msg-002',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          order_id: 'order-123',
          revenue: 99.99,
          currency: 'USD'
        },
        context: {
          traits: {
            email: 'test@example.com'
          }
        },
        userId: 'user-123',
        integrations: {
          'Rokt Conversions API': {
            rtid: 'test-rtid-from-integrations'
          }
        }
      })

      const expectedRoktPayload = {
        environment: 'production',
        device_info: {},
        user_attributes: {},
        user_identities: {
          email: 'test@example.com',
          customerid: 'user-123',
          other2: 'test-rtid-from-integrations'
        },
        events: [
          {
            event_type: 'custom_event',
            data: {
              custom_event_type: 'transaction',
              source_message_id: 'msg-002',
              timestamp_unixtime_ms: 1705579200000,
              event_name: 'conversion',
              custom_attributes: {
                conversiontype: 'Order Completed',
                confirmationref: 'order-123',
                amount: 99.99,
                currency: 'USD'
              }
            }
          }
        ],
        integration_attributes: {
          '1277': {
            passbackconversiontrackingid: 'test-rtid-from-integrations'
          }
        }
      }

      nock('https://inbound.mparticle.com').post('/s2s/v2/events', expectedRoktPayload).reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it.skip('should fallback to URL query parameter when integrations.Rokt Conversions API.rtid is not present', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        messageId: 'msg-003',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          order_id: 'order-456',
          revenue: 49.99,
          currency: 'USD'
        },
        context: {
          traits: {
            email: 'test2@example.com'
          },
          page: {
            search: '?utm_source=test&rtid=rtid-from-url&other=param'
          }
        },
        userId: 'user-456'
      })

      const expectedRoktPayload = {
        environment: 'production',
        device_info: {},
        user_attributes: {},
        user_identities: {
          email: 'test2@example.com',
          customerid: 'user-456',
          other2: 'rtid-from-url'
        },
        events: [
          {
            event_type: 'custom_event',
            data: {
              custom_event_type: 'transaction',
              source_message_id: 'msg-003',
              timestamp_unixtime_ms: 1705579200000,
              event_name: 'conversion',
              custom_attributes: {
                conversiontype: 'Order Completed',
                confirmationref: 'order-456',
                amount: 49.99,
                currency: 'USD'
              }
            }
          }
        ],
        integration_attributes: {
          '1277': {
            passbackconversiontrackingid: 'rtid-from-url'
          }
        }
      }

      nock('https://inbound.mparticle.com').post('/s2s/v2/events', expectedRoktPayload).reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it.skip('should hash email when hashEmail is enabled', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        messageId: 'msg-004',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          order_id: 'order-789',
          revenue: 150.0,
          currency: 'USD'
        },
        context: {
          traits: {
            email: 'TEST@EXAMPLE.COM'
          }
        },
        userId: 'user-789'
      })

      nock('https://inbound.mparticle.com')
        .post('/s2s/v2/events', (body) => {
          expect(body.user_identities).toBeDefined()
          expect(body.user_identities.other).toBeDefined()
          // Email should be hashed with lowercase and trimmed
          expect(body.user_identities.other.length).toBe(64) // SHA256 hex length
          expect(body.user_identities.email).toBeUndefined()
          return true
        })
        .reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true,
        mapping: {
          hashingConfiguration: {
            hashEmail: true
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it.skip('should send user attributes with hashing', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        messageId: 'msg-005',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          order_id: 'order-999',
          revenue: 200.0,
          currency: 'USD'
        },
        context: {
          traits: {
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            birthday: '1990-05-15',
            gender: 'm',
            address: {
              postal_code: '12345'
            }
          }
        },
        userId: 'user-999'
      })

      nock('https://inbound.mparticle.com')
        .post('/s2s/v2/events', (body) => {
          expect(body.user_attributes).toBeDefined()
          expect(body.user_attributes.firstnamesha256).toBeDefined()
          expect(body.user_attributes.firstnamesha256.length).toBe(64) // SHA256 hex length
          expect(body.user_attributes.lastnamesha256).toBeDefined()
          expect(body.user_attributes.lastnamesha256.length).toBe(64)
          expect(body.user_attributes.mobilesha256).toBeDefined()
          expect(body.user_attributes.mobilesha256.length).toBe(64)
          expect(body.user_attributes.billingzipsha256).toBeDefined()
          expect(body.user_attributes.billingzipsha256.length).toBe(64)
          expect(body.user_attributes.dob).toBe('19900515')
          expect(body.user_attributes.gender).toBe('m')
          expect(body.user_identities.other).toBeDefined()
          expect(body.user_identities.other.length).toBe(64) // Hashed email
          expect(body.user_identities.customerid).toBe('user-999')
          return true
        })
        .reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true,
        mapping: {
          hashingConfiguration: {
            hashEmail: true,
            hashFirstName: true,
            hashLastName: true,
            hashMobile: true,
            hashBillingZipcode: true
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it.skip('should send user attributes without hashing', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        messageId: 'msg-006',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          order_id: 'order-111',
          revenue: 75.0,
          currency: 'USD'
        },
        context: {
          traits: {
            email: 'user2@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '+9876543210',
            birthday: '1985-10-20',
            gender: 'f',
            address: {
              postal_code: '54321'
            }
          }
        },
        userId: 'user-111'
      })

      const expectedRoktPayload = {
        environment: 'production',
        device_info: {},
        user_attributes: {
          firstname: 'Jane',
          lastname: 'Smith',
          mobile: '+9876543210',
          billingzipcode: '54321',
          dob: '19851020',
          gender: 'f'
        },
        user_identities: {
          email: 'user2@example.com',
          customerid: 'user-111'
        },
        events: [
          {
            event_type: 'custom_event',
            data: {
              custom_event_type: 'transaction',
              source_message_id: 'msg-006',
              timestamp_unixtime_ms: 1705579200000,
              event_name: 'conversion',
              custom_attributes: {
                conversiontype: 'Order Completed',
                confirmationref: 'order-111',
                amount: 75.0,
                currency: 'USD'
              }
            }
          }
        ]
      }

      nock('https://inbound.mparticle.com').post('/s2s/v2/events', expectedRoktPayload).reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true,
        mapping: {
          hashingConfiguration: {
            hashEmail: false,
            hashFirstName: false,
            hashLastName: false,
            hashMobile: false,
            hashBillingZipcode: false
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send device information for iOS', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        messageId: 'msg-007',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          order_id: 'order-222',
          revenue: 120.0,
          currency: 'USD'
        },
        context: {
          device: {
            type: 'ios',
            advertisingId: 'ios-ad-id-123',
            id: 'ios-idfv-456'
          },
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
        },
        userId: 'user-222'
      })

      const expectedRoktPayload = {
        environment: 'production',
        device_info: {
          http_header_user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          ios_advertising_id: 'ios-ad-id-123',
          ios_idfv: 'ios-idfv-456'
        },
        user_attributes: {},
        user_identities: {
          customerid: 'user-222'
        },
        events: [
          {
            event_type: 'custom_event',
            data: {
              custom_event_type: 'transaction',
              source_message_id: 'msg-007',
              timestamp_unixtime_ms: 1705579200000,
              event_name: 'conversion',
              custom_attributes: {
                conversiontype: 'Order Completed',
                confirmationref: 'order-222',
                amount: 120.0,
                currency: 'USD'
              }
            }
          }
        ]
      }

      nock('https://inbound.mparticle.com').post('/s2s/v2/events', expectedRoktPayload).reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send device information for Android', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        messageId: 'msg-008',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          order_id: 'order-333',
          revenue: 85.0,
          currency: 'USD'
        },
        context: {
          device: {
            type: 'android',
            advertisingId: 'android-ad-id-789',
            id: 'android-uuid-012'
          },
          userAgent: 'Mozilla/5.0 (Linux; Android 11)'
        },
        userId: 'user-333'
      })

      const expectedRoktPayload = {
        environment: 'production',
        device_info: {
          http_header_user_agent: 'Mozilla/5.0 (Linux; Android 11)',
          android_advertising_id: 'android-ad-id-789',
          android_uuid: 'android-uuid-012'
        },
        user_attributes: {},
        user_identities: {
          customerid: 'user-333'
        },
        events: [
          {
            event_type: 'custom_event',
            data: {
              custom_event_type: 'transaction',
              source_message_id: 'msg-008',
              timestamp_unixtime_ms: 1705579200000,
              event_name: 'conversion',
              custom_attributes: {
                conversiontype: 'Order Completed',
                confirmationref: 'order-333',
                amount: 85.0,
                currency: 'USD'
              }
            }
          }
        ]
      }

      nock('https://inbound.mparticle.com').post('/s2s/v2/events', expectedRoktPayload).reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it.skip('should send ROKT Click ID (rtid) from integrations object', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        messageId: 'msg-009',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          order_id: 'order-444'
        },
        context: {
          traits: {
            email: 'user@test.com'
          }
        },
        integrations: {
          'Rokt Conversions API': {
            rtid: 'rokt-click-id-999'
          }
        },
        userId: 'user-444'
      })

      const expectedRoktPayload = {
        environment: 'production',
        device_info: {},
        user_attributes: {},
        user_identities: {
          email: 'user@test.com',
          customerid: 'user-444',
          other2: 'rokt-click-id-999'
        },
        integration_attributes: {
          '1277': {
            passbackconversiontrackingid: 'rokt-click-id-999'
          }
        },
        events: [
          {
            event_type: 'custom_event',
            data: {
              custom_event_type: 'transaction',
              source_message_id: 'msg-009',
              timestamp_unixtime_ms: 1705579200000,
              event_name: 'conversion',
              custom_attributes: {
                conversiontype: 'Order Completed',
                confirmationref: 'order-444'
              }
            }
          }
        ]
      }

      nock('https://inbound.mparticle.com').post('/s2s/v2/events', expectedRoktPayload).reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it.skip('should send custom event properties', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        messageId: 'msg-010',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          order_id: 'order-555',
          revenue: 300.0,
          currency: 'USD',
          product_name: 'Widget Pro',
          quantity: 3,
          is_premium: true
        },
        context: {
          traits: {
            email: 'user@test.com'
          }
        },
        userId: 'user-555'
      })

      const expectedRoktPayload = {
        environment: 'production',
        device_info: {},
        user_attributes: {},
        user_identities: {
          email: 'user@test.com',
          customerid: 'user-555'
        },
        events: [
          {
            event_type: 'custom_event',
            data: {
              custom_event_type: 'transaction',
              source_message_id: 'msg-010',
              timestamp_unixtime_ms: 1705579200000,
              event_name: 'conversion',
              custom_attributes: {
                conversiontype: 'Order Completed',
                confirmationref: 'order-555',
                amount: 300.0,
                currency: 'USD',
                product_name: 'Widget Pro',
                quantity: 3,
                is_premium: true
              }
            }
          }
        ]
      }

      nock('https://inbound.mparticle.com').post('/s2s/v2/events', expectedRoktPayload).reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true,
        mapping: {
          eventProperties: {
            product_name: 'Widget Pro',
            quantity: 3,
            is_premium: true
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send audience membership update for Engage Audience', async () => {
      const event = createTestEvent({
        event: 'Audience Entered',
        messageId: 'msg-011',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          premium_users: true
        },
        context: {
          personas: {
            audience_key: 'premium_users',
            computation_class: 'audience'
          },
          traits: {
            email: 'premium@example.com'
          }
        },
        userId: 'user-666'
      })

      nock('https://inbound.mparticle.com')
        .post('/s2s/v2/events', (body) => {
          expect(body.events).toBeDefined()
          expect(body.events.length).toBe(1)
          expect(body.events[0].data.event_name).toBe('audiencemembershipupdate')
          expect(body.events[0].data.custom_event_type).toBe('other')
          expect(body.events[0].data.custom_attributes.audience_name).toBe('premium_users')
          expect(body.events[0].data.custom_attributes.status).toBe('add')
          expect(body.user_attributes.segment_premium_users).toBe(true)
          return true
        })
        .reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true,
        mapping: {
          eventDetails: {
            source_message_id: 'msg-011',
            timestamp_unixtime_ms: '2024-01-18T12:00:00.000Z'
          },
          engageAudienceName: 'premium_users',
          traitsOrProps: {
            premium_users: true
          },
          computationAction: 'audience'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send custom audience membership update', async () => {
      const event = createTestEvent({
        event: 'Custom Audience Update',
        messageId: 'msg-012',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          audience_name: 'high_value_customers',
          audience_membership: true
        },
        context: {
          traits: {
            email: 'highvalue@example.com'
          }
        },
        userId: 'user-777'
      })

      nock('https://inbound.mparticle.com')
        .post('/s2s/v2/events', (body) => {
          expect(body.events).toBeDefined()
          expect(body.events.length).toBe(1)
          expect(body.events[0].data.event_name).toBe('audiencemembershipupdate')
          expect(body.events[0].data.custom_event_type).toBe('other')
          expect(body.events[0].data.custom_attributes.audience_name).toBe('high_value_customers')
          expect(body.events[0].data.custom_attributes.status).toBe('add')
          expect(body.user_attributes.segment_high_value_customers).toBe(true)
          return true
        })
        .reply(200, { success: true })

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true,
        mapping: {
          eventDetails: {
            source_message_id: 'msg-012',
            timestamp_unixtime_ms: '2024-01-18T12:00:00.000Z'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should reject event with no identifiers', async () => {
      const event = createTestEvent({
        event: 'Order Completed',
        messageId: 'msg-013',
        timestamp: '2024-01-18T12:00:00.000Z',
        type: 'track',
        properties: {
          order_id: 'order-888',
          revenue: 50.0,
          currency: 'USD'
        },
        context: {},
        userId: undefined
      })

      await expect(
        testDestination.testAction('send', {
          event,
          useDefaultMappings: true,
          mapping: {
            user_identities: {},
            device_info: {}
          }
        })
      ).rejects.toThrow(
        'At least one of the following is required: iOS Advertising ID, Android Advertising ID, iOS ID for Vendor, Android UUID, Email, Customer ID, RTID.'
      )
    })
  })

  describe('Batch Event Tests', () => {
    it.skip('should send a batch of valid events', async () => {
      const events = [
        createTestEvent({
          event: 'Order Completed',
          messageId: 'batch-msg-001',
          timestamp: '2024-01-18T12:00:00.000Z',
          type: 'track',
          properties: {
            order_id: 'batch-order-001',
            revenue: 100.0,
            currency: 'USD'
          },
          context: {
            traits: {
              email: 'batch1@example.com'
            }
          },
          userId: 'batch-user-001'
        }),
        createTestEvent({
          event: 'Order Completed',
          messageId: 'batch-msg-002',
          timestamp: '2024-01-18T12:01:00.000Z',
          type: 'track',
          properties: {
            order_id: 'batch-order-002',
            revenue: 200.0,
            currency: 'USD'
          },
          context: {
            traits: {
              email: 'batch2@example.com'
            }
          },
          userId: 'batch-user-002'
        }),
        createTestEvent({
          event: 'Order Completed',
          messageId: 'batch-msg-003',
          timestamp: '2024-01-18T12:02:00.000Z',
          type: 'track',
          properties: {
            order_id: 'batch-order-003',
            revenue: 300.0,
            currency: 'USD'
          },
          context: {
            traits: {
              email: 'batch3@example.com'
            }
          },
          userId: 'batch-user-003'
        })
      ]

      const expectedRoktBatchPayload = [
        {
          environment: 'production',
          device_info: {},
          user_attributes: {},
          user_identities: {
            email: 'batch1@example.com',
            customerid: 'batch-user-001'
          },
          events: [
            {
              event_type: 'custom_event',
              data: {
                custom_event_type: 'transaction',
                source_message_id: 'batch-msg-001',
                timestamp_unixtime_ms: 1705579200000,
                event_name: 'conversion',
                custom_attributes: {
                  conversiontype: 'Order Completed',
                  confirmationref: 'batch-order-001',
                  amount: 100.0,
                  currency: 'USD'
                }
              }
            }
          ]
        },
        {
          environment: 'production',
          device_info: {},
          user_attributes: {},
          user_identities: {
            email: 'batch2@example.com',
            customerid: 'batch-user-002'
          },
          events: [
            {
              event_type: 'custom_event',
              data: {
                custom_event_type: 'transaction',
                source_message_id: 'batch-msg-002',
                timestamp_unixtime_ms: 1705579260000,
                event_name: 'conversion',
                custom_attributes: {
                  conversiontype: 'Order Completed',
                  confirmationref: 'batch-order-002',
                  amount: 200.0,
                  currency: 'USD'
                }
              }
            }
          ]
        },
        {
          environment: 'production',
          device_info: {},
          user_attributes: {},
          user_identities: {
            email: 'batch3@example.com',
            customerid: 'batch-user-003'
          },
          events: [
            {
              event_type: 'custom_event',
              data: {
                custom_event_type: 'transaction',
                source_message_id: 'batch-msg-003',
                timestamp_unixtime_ms: 1705579320000,
                event_name: 'conversion',
                custom_attributes: {
                  conversiontype: 'Order Completed',
                  confirmationref: 'batch-order-003',
                  amount: 300.0,
                  currency: 'USD'
                }
              }
            }
          ]
        }
      ]

      nock('https://inbound.mparticle.com')
        .post('/s2s/v2/bulkevents', expectedRoktBatchPayload)
        .reply(200, { success: true })

      const responses = await testDestination.testBatchAction('send', {
        events,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toEqual({ success: true })
    })

    it.skip('should handle mixed batch with valid and invalid events', async () => {
      const events = [
        // Valid event
        createTestEvent({
          event: 'Order Completed',
          messageId: 'mixed-msg-001',
          timestamp: '2024-01-18T12:00:00.000Z',
          type: 'track',
          properties: {
            order_id: 'mixed-order-001',
            revenue: 100.0,
            currency: 'USD'
          },
          context: {
            traits: {
              email: 'valid1@example.com'
            }
          },
          userId: 'valid-user-001'
        }),
        // Invalid event - no identifiers
        createTestEvent({
          event: 'Order Completed',
          messageId: 'mixed-msg-002',
          timestamp: '2024-01-18T12:01:00.000Z',
          type: 'track',
          properties: {
            order_id: 'mixed-order-002',
            revenue: 200.0,
            currency: 'USD'
          },
          context: {},
          userId: undefined
        }),
        // Valid event
        createTestEvent({
          event: 'Order Completed',
          messageId: 'mixed-msg-003',
          timestamp: '2024-01-18T12:02:00.000Z',
          type: 'track',
          properties: {
            order_id: 'mixed-order-003',
            revenue: 300.0,
            currency: 'USD'
          },
          context: {
            traits: {
              email: 'valid2@example.com'
            }
          },
          userId: 'valid-user-003'
        }),
        // Invalid event - no identifiers
        createTestEvent({
          event: 'Order Completed',
          messageId: 'mixed-msg-004',
          timestamp: '2024-01-18T12:03:00.000Z',
          type: 'track',
          properties: {
            order_id: 'mixed-order-004',
            revenue: 400.0,
            currency: 'USD'
          },
          context: {},
          userId: undefined
        })
      ]

      nock('https://inbound.mparticle.com')
        .post('/s2s/v2/bulkevents', (body) => {
          // Verify only valid events (first and third) are sent
          expect(Array.isArray(body)).toBe(true)
          expect(body.length).toBe(2)
          expect(body[0].user_identities.email).toBe('valid1@example.com')
          expect(body[1].user_identities.email).toBe('valid2@example.com')
          return true
        })
        .reply(200, { success: true })

      const responses = await testDestination.testBatchAction('send', {
        events,
        useDefaultMappings: true,
        mapping: [
          {}, // First event - use defaults
          { user_identities: {}, device_info: {} }, // Second event - no identifiers
          {}, // Third event - use defaults
          { user_identities: {}, device_info: {} } // Fourth event - no identifiers
        ]
      })

      // Batch request should succeed
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toEqual({ success: true })
    })

    it('should handle batch with all invalid events', async () => {
      const events = [
        createTestEvent({
          event: 'Order Completed',
          messageId: 'invalid-msg-001',
          timestamp: '2024-01-18T12:00:00.000Z',
          type: 'track',
          properties: {
            order_id: 'invalid-order-001'
          },
          context: {},
          userId: undefined
        }),
        createTestEvent({
          event: 'Order Completed',
          messageId: 'invalid-msg-002',
          timestamp: '2024-01-18T12:01:00.000Z',
          type: 'track',
          properties: {
            order_id: 'invalid-order-002'
          },
          context: {},
          userId: undefined
        })
      ]

      // No HTTP call should be made since all events are invalid
      const responses = await testDestination.testBatchAction('send', {
        events,
        useDefaultMappings: true,
        mapping: [
          { user_identities: {}, device_info: {} },
          { user_identities: {}, device_info: {} }
        ]
      })

      // Should return empty response since no valid events to send
      expect(responses.length).toBe(0)
    })

    it('should handle batch API error', async () => {
      const events = [
        createTestEvent({
          event: 'Order Completed',
          messageId: 'error-msg-001',
          timestamp: '2024-01-18T12:00:00.000Z',
          type: 'track',
          properties: {
            order_id: 'error-order-001'
          },
          context: {
            traits: {
              email: 'error1@example.com'
            }
          },
          userId: 'error-user-001'
        }),
        createTestEvent({
          event: 'Order Completed',
          messageId: 'error-msg-002',
          timestamp: '2024-01-18T12:01:00.000Z',
          type: 'track',
          properties: {
            order_id: 'error-order-002'
          },
          context: {
            traits: {
              email: 'error2@example.com'
            }
          },
          userId: 'error-user-002'
        })
      ]

      nock('https://inbound.mparticle.com').post('/s2s/v2/bulkevents').reply(500, { error: 'Internal Server Error' })

      const responses = await testDestination.testBatchAction('send', {
        events,
        useDefaultMappings: true
      })

      // Batch mode handles errors gracefully and returns a response
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(500)
      expect(responses[0].data).toEqual({ error: 'Internal Server Error' })
    })
  })
})
