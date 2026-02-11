import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Braze from '../index'
import { BrazeTrackUserAPIResponse } from '../utils'

beforeEach(() => nock.cleanAll())

const testDestination = createTestIntegration(Braze)

const settings = {
  app_id: 'my-app-id',
  api_key: 'my-api-key',
  endpoint: 'https://rest.iad-01.braze.com' as const
}

const receivedAt = '2024-08-01T17:40:04.055Z'

describe('MultiStatus', () => {
  describe('trackEvent', () => {
    const mapping = {
      name: {
        '@path': '$.traits.name'
      },
      time: receivedAt,
      email: {
        '@path': '$.traits.email'
      },
      external_id: {
        '@path': '$.traits.externalId'
      },
      braze_id: {
        '@path': '$.traits.brazeId'
      }
    }

    it('should successfully handle a batch of events with complete success response from Braze API', async () => {
      nock(settings.endpoint).post('/users/track').reply(201, {})

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            name: 'Example User One',
            externalId: 'test-external-id'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            name: 'Example User Two',
            email: 'user@example.com'
          }
        }),
        // Event without any user identifier
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            name: 'Example User Two'
          }
        })
      ]

      const response = await testDestination.executeBatch('trackEvent', {
        events,
        settings,
        mapping
      })

      // The first event doesn't fail as there is no error reported by Braze API
      expect(response[0]).toMatchObject({
        status: 200,
        body: 'success'
      })

      // The second event doesn't fail as there is no error reported by Braze API
      expect(response[1]).toMatchObject({
        status: 200,
        body: 'success'
      })

      // The third event fails as pre-request validation fails for not having a valid user identifier
      expect(response[2]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" is required.',
        errorreporter: 'INTEGRATIONS'
      })
    })

    it('should successfully handle a batch of events with partial success response from Braze API', async () => {
      // Mocking a 400 response from Braze API
      const mockResponse: BrazeTrackUserAPIResponse = {
        events_processed: 2,
        message: 'success',
        errors: [
          {
            type: 'a test error occurred',
            input_array: 'events',
            index: 1
          }
        ]
      }

      nock(settings.endpoint).post('/users/track').reply(201, mockResponse)

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            name: 'Example User One',
            externalId: 'test-external-id'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            name: 'Example User Two',
            externalId: 'test-external-id'
          }
        })
      ]

      const response = await testDestination.executeBatch('trackEvent', {
        events,
        settings,
        mapping
      })

      // The first doesn't fail as there is no error reported by Braze API
      expect(response[0]).toMatchObject({
        status: 200
      })

      // The second event fails as Braze API reports an error
      expect(response[1]).toMatchObject({
        status: 400,
        errormessage: 'a test error occurred',
        errortype: 'BAD_REQUEST',
        errorreporter: 'DESTINATION'
      })
    })

    it('should successfully handle a batch of events with fatal error response from Braze API', async () => {
      // Mocking a 400 response from Braze API
      const mockResponse: BrazeTrackUserAPIResponse = {
        message: "Valid data must be provided in the 'attributes', 'events', or 'purchases' fields.",
        errors: [
          {
            type: 'Test fatal error',
            input_array: 'events',
            index: 0
          },
          {
            type: 'Test fatal error',
            input_array: 'events',
            index: 0
          }
        ]
      }

      nock(settings.endpoint).post('/users/track').reply(400, mockResponse)

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            name: 'Example User One',
            externalId: 'test-external-id'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            name: 'Example User Two',
            externalId: 'test-external-id'
          }
        })
      ]

      const response = await testDestination.executeBatch('trackEvent', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          status: 400,
          errormessage: "Valid data must be provided in the 'attributes', 'events', or 'purchases' fields.",
          errortype: 'BAD_REQUEST',
          errorreporter: 'DESTINATION'
        },
        {
          status: 400,
          errormessage: "Valid data must be provided in the 'attributes', 'events', or 'purchases' fields.",
          errortype: 'BAD_REQUEST',
          errorreporter: 'DESTINATION'
        }
      ])
    })
  })

  describe('trackPurchase', () => {
    const mapping = {
      time: receivedAt,
      email: {
        '@path': '$.properties.email'
      },
      external_id: {
        '@path': '$.properties.externalId'
      },
      products: {
        '@path': '$.properties.products'
      }
    }

    it('should successfully handle a batch of events with complete success response from Braze API', async () => {
      nock(settings.endpoint).post('/users/track').reply(201, {})

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id',
            products: [
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              },
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              }
            ]
          }
        }),
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            email: 'user@example.com',
            products: [
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              },
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              }
            ]
          }
        }),
        // Event with no product
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id',
            products: []
          }
        }),
        // Event without any user identifier
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            products: [
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              }
            ]
          }
        })
      ]

      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        settings,
        mapping
      })

      // The first event doesn't fail as there is no error reported by Braze API
      expect(response[0]).toMatchObject({
        status: 200,
        body: 'success'
      })

      expect(response[1]).toMatchObject({
        status: 200,
        body: 'success'
      })

      // The third event fails as it doesn't have any products
      expect(response[2]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'This event was not sent to Braze because it did not contain any products.',
        errorreporter: 'DESTINATION'
      })

      // The forth event fails as pre-request validation fails for not having a valid user identifier
      expect(response[3]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" is required.',
        errorreporter: 'INTEGRATIONS'
      })
    })

    it('should successfully handle a batch of events with partial success response from Braze API', async () => {
      // Mocking a 400 response from Braze API
      const mockResponse: BrazeTrackUserAPIResponse = {
        events_processed: 4,
        message: 'success',
        errors: [
          {
            type: 'a test error occurred',
            input_array: 'purchases',
            index: 1
          }
        ]
      }

      nock(settings.endpoint).post('/users/track').reply(201, mockResponse)

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id',
            products: [
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              },
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              }
            ]
          }
        }),
        // Valid Event
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id',
            products: [
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              },
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              }
            ]
          }
        }),
        // Event with no product
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id',
            products: []
          }
        })
      ]

      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        settings,
        mapping
      })

      // Since each product in an event is further flattened to multiple items in requests,
      // if any one of the is reported as failed then the entire event is considered failed.

      // The first event fails as it expands to 2 request items and one of them fails
      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'a test error occurred',
        errorreporter: 'DESTINATION'
      })

      // The second event doesn't fail as both the expanded request items are successful
      expect(response[1]).toMatchObject({
        status: 200,
        body: 'success'
      })

      // The third event fails as it doesn't have any products and skipped with success response
      expect(response[2]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'This event was not sent to Braze because it did not contain any products.',
        errorreporter: 'DESTINATION'
      })
    })

    it('should successfully handle a batch of events with fatal error response from Braze API', async () => {
      // Mocking a 400 response from Braze API
      const mockResponse: BrazeTrackUserAPIResponse = {
        message: "Valid data must be provided in the 'attributes', 'events', or 'purchases' fields.",
        errors: [
          {
            type: 'Test fatal error',
            input_array: 'events',
            index: 0
          },
          {
            type: 'Test fatal error',
            input_array: 'events',
            index: 0
          }
        ]
      }

      nock(settings.endpoint).post('/users/track').reply(400, mockResponse)

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id',
            products: [
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              },
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              }
            ]
          }
        }),
        // Valid Event
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id',
            products: [
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              },
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              }
            ]
          }
        }),
        // Event with no product
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id',
            products: []
          }
        })
      ]

      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          status: 400,
          errormessage: "Valid data must be provided in the 'attributes', 'events', or 'purchases' fields.",
          errortype: 'BAD_REQUEST',
          errorreporter: 'DESTINATION'
        },
        {
          status: 400,
          errormessage: "Valid data must be provided in the 'attributes', 'events', or 'purchases' fields.",
          errortype: 'BAD_REQUEST',
          errorreporter: 'DESTINATION'
        },
        {
          status: 400,
          errormessage: 'This event was not sent to Braze because it did not contain any products.',
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errorreporter: 'DESTINATION'
        }
      ])
    })
  })

  describe('updateUserProfile', () => {
    const mapping = {
      first_name: {
        '@path': '$.traits.firstName'
      },
      last_name: {
        '@path': '$.traits.lastName'
      },
      time: receivedAt,
      email: {
        '@path': '$.traits.email'
      },
      external_id: {
        '@path': '$.traits.externalId'
      },
      braze_id: {
        '@path': '$.traits.brazeId'
      },
      subscription_groups: {
        '@path': '$.traits.subscription_groups'
      }
    }

    it('should successfully handle a batch of events with complete success response from Braze API', async () => {
      nock(settings.endpoint).post('/users/track').reply(201, {})

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User',
            externalId: 'test-external-id'
          }
        }),
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User',
            email: 'user@example.com'
          }
        }),
        // Event without any user identifier
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User'
          }
        })
      ]

      const response = await testDestination.executeBatch('updateUserProfile', {
        events,
        settings,
        mapping
      })

      // The first event doesn't fail as there is no error reported by Braze API
      expect(response[0]).toMatchObject({
        status: 200,
        body: 'success'
      })

      // The second event doesn't fail as there is no error reported by Braze API
      expect(response[1]).toMatchObject({
        status: 200,
        body: 'success'
      })

      // The third event fails as pre-request validation fails for not having a valid user identifier
      expect(response[2]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" is required.',
        errorreporter: 'INTEGRATIONS'
      })
    })

    it('should successfully handle a batch of events with partial success response from Braze API', async () => {
      // Mocking a 400 response from Braze API
      const mockResponse: BrazeTrackUserAPIResponse = {
        events_processed: 2,
        message: 'success',
        errors: [
          {
            type: 'a test error occurred',
            input_array: 'events',
            index: 1
          }
        ]
      }

      nock(settings.endpoint).post('/users/track').reply(201, mockResponse)

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User',
            externalId: 'test-external-id'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User',
            externalId: 'test-external-id'
          }
        })
      ]

      const response = await testDestination.executeBatch('updateUserProfile', {
        events,
        settings,
        mapping
      })

      // The first doesn't fail as there is no error reported by Braze API
      expect(response[0]).toMatchObject({
        status: 200
      })

      // The second event fails as Braze API reports an error
      expect(response[1]).toMatchObject({
        status: 400,
        errormessage: 'a test error occurred',
        errortype: 'BAD_REQUEST',
        errorreporter: 'DESTINATION'
      })
    })

    it('should successfully handle a batch of events with fatal error response from Braze API', async () => {
      // Mocking a 400 response from Braze API
      const mockResponse: BrazeTrackUserAPIResponse = {
        message: "Valid data must be provided in the 'attributes', 'events', or 'purchases' fields.",
        errors: [
          {
            type: 'Test fatal error',
            input_array: 'events',
            index: 0
          },
          {
            type: 'Test fatal error',
            input_array: 'events',
            index: 0
          }
        ]
      }

      nock(settings.endpoint).post('/users/track').reply(400, mockResponse)

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User',
            externalId: 'test-external-id'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User',
            externalId: 'test-external-id'
          }
        })
      ]

      const response = await testDestination.executeBatch('updateUserProfile', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          status: 400,
          errormessage: "Valid data must be provided in the 'attributes', 'events', or 'purchases' fields.",
          errortype: 'BAD_REQUEST',
          errorreporter: 'DESTINATION'
        },
        {
          status: 400,
          errormessage: "Valid data must be provided in the 'attributes', 'events', or 'purchases' fields.",
          errortype: 'BAD_REQUEST',
          errorreporter: 'DESTINATION'
        }
      ])
    })

    it('should successfully handle a batch of events with subscription details, even if one fails validation', async () => {
      nock(settings.endpoint).post('/users/track').reply(201, {})

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User',
            externalId: 'test-external-id',
            subscription_groups: [
              {
                subscription_group_id: 'newsletter_123',
                subscription_state: 'subscribed'
              },
              {
                subscription_group_id: 'promotional_456',
                subscription_state: 'unsubscribed'
              }
            ]
          }
        }),
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User',
            email: 'user@example.com',
            subscription_groups: [
              {
                subscription_group_id: 'newsletter_9898'
              }
            ]
          }
        }),
        // Event without any user identifier
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User',
            email: 'user@example.com',
            subscription_groups: [
              {
                subscription_group_id: 'newsletter_9898',
                subscription_state: 'unsubscribed'
              }
            ]
          }
        })
      ]

      const response = await testDestination.executeBatch('updateUserProfile', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 200,
        body: 'success'
      })

      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "The value at /subscription_groups/0 is missing the required field 'subscription_state'.",
        errorreporter: 'INTEGRATIONS'
      })

      expect(response[2]).toMatchObject({
        status: 200,
        body: 'success'
      })
    })
  })

  describe('trackPurchase - batch size limits', () => {
    const mapping = {
      time: receivedAt,
      email: {
        '@path': '$.properties.email'
      },
      external_id: {
        '@path': '$.properties.externalId'
      },
      products: {
        '@path': '$.properties.products'
      }
    }

    it('should accept exactly 75 products across multiple payloads', async () => {
      nock(settings.endpoint).post('/users/track').reply(201, {})

      // Create 3 payloads with 25 products each (total 75)
      const events: SegmentEvent[] = [
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id-1',
            products: Array.from({ length: 25 }, (_, i) => ({
              product_id: `product-${i}`,
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }))
          }
        }),
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id-2',
            products: Array.from({ length: 25 }, (_, i) => ({
              product_id: `product-${i + 25}`,
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }))
          }
        }),
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id-3',
            products: Array.from({ length: 25 }, (_, i) => ({
              product_id: `product-${i + 50}`,
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }))
          }
        })
      ]

      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        settings,
        mapping
      })

      // All three events should succeed
      expect(response[0]).toMatchObject({
        status: 200,
        body: 'success'
      })
      expect(response[1]).toMatchObject({
        status: 200,
        body: 'success'
      })
      expect(response[2]).toMatchObject({
        status: 200,
        body: 'success'
      })
    })

    it('should reject a single payload with 76 products', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id',
            products: Array.from({ length: 76 }, (_, i) => ({
              product_id: `product-${i}`,
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }))
          }
        })
      ]

      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        settings,
        mapping
      })

      // The event should be rejected with a 413 (permanent rejection)
      expect(response[0]).toMatchObject({
        status: 413,
        errortype: 'PAYLOAD_TOO_LARGE',
        errormessage:
          "Max batch size exceeded. This payload contains 76 products, which is more than Braze's maximum batch size of 75 objects per batch.",
        errorreporter: 'DESTINATION'
      })
    })

    it('should reject payloads that exceed the 75 product limit', async () => {
      nock(settings.endpoint).post('/users/track').reply(201, {})

      // Create payloads: 50 products, then 26 products (would exceed 75)
      const events: SegmentEvent[] = [
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id-1',
            products: Array.from({ length: 50 }, (_, i) => ({
              product_id: `product-${i}`,
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }))
          }
        }),
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id-2',
            products: Array.from({ length: 26 }, (_, i) => ({
              product_id: `product-${i + 50}`,
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }))
          }
        })
      ]

      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        settings,
        mapping
      })

      // First event should succeed (50 products)
      expect(response[0]).toMatchObject({
        status: 200,
        body: 'success'
      })

      // Second event should be rejected (would make total 76)
      expect(response[1]).toMatchObject({
        status: 429,
        errortype: 'RETRYABLE_ERROR',
        errormessage: `Max batch size exceeded. This event was included in a batch which then exceeded Braze's maximum batch size of 75 objects per batch. This payload will be retried in another batch.`,
        errorreporter: 'DESTINATION'
      })
    })

    it('should handle edge case where exactly 75th product is in last payload', async () => {
      nock(settings.endpoint).post('/users/track').reply(201, {})

      // Create payloads: 50, 24, 1 product (exactly 75 total)
      const events: SegmentEvent[] = [
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id-1',
            products: Array.from({ length: 50 }, (_, i) => ({
              product_id: `product-${i}`,
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }))
          }
        }),
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id-2',
            products: Array.from({ length: 24 }, (_, i) => ({
              product_id: `product-${i + 50}`,
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }))
          }
        }),
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id-3',
            products: [
              {
                product_id: 'product-74',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              }
            ]
          }
        })
      ]

      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        settings,
        mapping
      })

      // All events should succeed
      expect(response[0]).toMatchObject({
        status: 200,
        body: 'success'
      })
      expect(response[1]).toMatchObject({
        status: 200,
        body: 'success'
      })
      expect(response[2]).toMatchObject({
        status: 200,
        body: 'success'
      })
    })

    it('should reject remaining payloads after hitting limit', async () => {
      nock(settings.endpoint).post('/users/track').reply(201, {})

      // Create payloads: 50, 20, 10 products (first two succeed, third rejected)
      const events: SegmentEvent[] = [
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id-1',
            products: Array.from({ length: 50 }, (_, i) => ({
              product_id: `product-${i}`,
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }))
          }
        }),
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id-2',
            products: Array.from({ length: 20 }, (_, i) => ({
              product_id: `product-${i + 50}`,
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }))
          }
        }),
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id-3',
            products: Array.from({ length: 10 }, (_, i) => ({
              product_id: `product-${i + 70}`,
              currency: 'USD',
              price: 99.99,
              quantity: 1
            }))
          }
        })
      ]

      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        settings,
        mapping
      })

      // First two events should succeed
      expect(response[0]).toMatchObject({
        status: 200,
        body: 'success'
      })
      expect(response[1]).toMatchObject({
        status: 200,
        body: 'success'
      })

      // Third event should be rejected (would make total 80)
      expect(response[2]).toMatchObject({
        status: 429,
        errortype: 'RETRYABLE_ERROR',
        errormessage: `Max batch size exceeded. This event was included in a batch which then exceeded Braze's maximum batch size of 75 objects per batch. This payload will be retried in another batch.`,
        errorreporter: 'DESTINATION'
      })
    })
  })

  describe('syncMode', () => {
    it('trackEvent2 - should return a multiStatus error response when syncMode is not set', async () => {
      nock(settings.endpoint).post('/users/track').reply(201, {})

      const mapping = {
        name: {
          '@path': '$.traits.name'
        },
        time: receivedAt,
        email: {
          '@path': '$.traits.email'
        },
        external_id: {
          '@path': '$.traits.externalId'
        },
        braze_id: {
          '@path': '$.traits.brazeId'
        }
      }

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            name: 'Example User One',
            externalId: 'test-external-id-1'
          }
        }),
        // Event without any user identifier
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            name: 'Example User Two',
            externalId: 'test-external-id-2'
          }
        })
      ]

      const response = await testDestination.executeBatch('trackEvent2', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          errormessage: 'Invalid syncMode, must be set to "add" or "update"',
          errorreporter: 'INTEGRATIONS',
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          status: 400
        },
        {
          errormessage: 'Invalid syncMode, must be set to "add" or "update"',
          errorreporter: 'INTEGRATIONS',
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          status: 400
        }
      ])
    })

    it('trackPurchase2 - should return a multiStatus error response when syncMode is not set', async () => {
      nock(settings.endpoint).post('/users/track').reply(201, {})

      const mapping = {
        time: receivedAt,
        external_id: {
          '@path': '$.properties.externalId'
        },
        products: {
          '@path': '$.properties.products'
        }
      }

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id',
            products: [
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              },
              {
                product_id: 'test-product-id',
                currency: 'USD',
                price: 99.99,
                quantity: 1
              }
            ]
          }
        }),
        // Event with no product
        createTestEvent({
          event: 'Order Completed',
          type: 'track',
          receivedAt,
          properties: {
            externalId: 'test-external-id',
            products: []
          }
        })
      ]

      const response = await testDestination.executeBatch('trackPurchase2', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          errormessage: 'Invalid syncMode, must be set to "add" or "update"',
          errorreporter: 'INTEGRATIONS',
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          status: 400
        },
        {
          errormessage: 'Invalid syncMode, must be set to "add" or "update"',
          errorreporter: 'INTEGRATIONS',
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          status: 400
        }
      ])
    })

    it('updateUserProfile2 - should return a multiStatus error response when syncMode is not set', async () => {
      nock(settings.endpoint).post('/users/track').reply(201, {})

      const mapping = {
        first_name: {
          '@path': '$.traits.firstName'
        },
        last_name: {
          '@path': '$.traits.lastName'
        },
        time: receivedAt,
        email: {
          '@path': '$.traits.email'
        },
        external_id: {
          '@path': '$.traits.externalId'
        },
        braze_id: {
          '@path': '$.traits.brazeId'
        }
      }

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User',
            externalId: 'test-external-id-1'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'identify',
          receivedAt,
          traits: {
            firstName: 'Example',
            lastName: 'User',
            externalId: 'test-external-id-2'
          }
        })
      ]

      const response = await testDestination.executeBatch('updateUserProfile2', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          errormessage: 'Invalid syncMode, must be set to "add" or "update"',
          errorreporter: 'INTEGRATIONS',
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          status: 400
        },
        {
          errormessage: 'Invalid syncMode, must be set to "add" or "update"',
          errorreporter: 'INTEGRATIONS',
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          status: 400
        }
      ])
    })
  })
})
