import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { API_URL } from '../config'
import Klaviyo from '../index'

beforeEach(() => nock.cleanAll())

const testDestination = createTestIntegration(Klaviyo)

const settings = {
  api_key: 'my-api-key'
}

const timestamp = '2024-07-22T20:08:49.7931Z'

describe('MultiStatus', () => {
  describe('trackEvent', () => {
    const mapping = {
      profile: {
        '@path': '$.properties'
      },
      metric_name: {
        '@path': '$.event'
      },
      properties: {
        '@path': '$.properties'
      },
      time: {
        '@path': '$.timestamp'
      },
      unique_id: {
        '@path': '$.messageId'
      }
    }

    it("should successfully handle those payload where phone_number is invalid and couldn't be converted to E164 format", async () => {
      nock(API_URL).post('/event-bulk-create-jobs/').reply(202, {})

      const events: SegmentEvent[] = [
        // Event with invalid phone_number
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            country_code: 'IN',
            phone_number: '701271',
            email: 'valid@gmail.com'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            email: 'valid@gmail.com'
          }
        })
      ]

      const response = await testDestination.executeBatch('trackEvent', {
        events,
        settings,
        mapping
      })

      // The First event fails as pre-request validation fails for having invalid phone_number and could not be converted to E164 format
      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Phone number could not be converted to E.164 format.',
        errorreporter: 'DESTINATION'
      })

      // The Second event doesn't fail as there is no error reported by Klaviyo API
      expect(response[1]).toMatchObject({
        status: 200,
        body: 'success'
      })
    })

    it('should successfully handle a batch of events with complete success response from Klaviyo API', async () => {
      nock(API_URL).post('/event-bulk-create-jobs/').reply(202, {})

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            email: 'valid@gmail.com'
          }
        }),
        // Event without any user identifier
        createTestEvent({
          type: 'track',
          timestamp
        }),
        //Event with invalid Email
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            email: 'invalid_email@gmail..com',
            list_id: '123'
          }
        })
      ]

      const response = await testDestination.executeBatch('trackEvent', {
        events,
        settings,
        mapping
      })

      // The first event doesn't fail as there is no error reported by Klaviyo API
      expect(response[0]).toMatchObject({
        status: 200,
        body: 'success'
      })

      // The second event fails as pre-request validation fails for not having any user identifier
      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of External ID, Anonymous ID, Phone Number or Email is required.',
        errorreporter: 'DESTINATION'
      })
      // The third event fails as pre-request validation fails for having invalid email
      expect(response[2]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Email format is invalid.Please ensure it follows the standard format',
        errorreporter: 'DESTINATION'
      })
    })

    it('should successfully handle a batch of events with failure response from Klaviyo API', async () => {
      // Mocking a 400 response from Klaviyo API
      const mockResponse = {
        errors: [
          {
            id: '752f7ece-af20-44e0-aa3a-b13290d98e72',
            status: 400,
            code: 'invalid',
            title: 'Invalid input.',
            detail: 'Invalid input',
            source: {
              pointer: '/data/attributes/events-bulk-create/data/0/attributes/email'
            },
            links: {},
            meta: {}
          }
        ]
      }
      nock(API_URL).post('/event-bulk-create-jobs/').reply(400, mockResponse)

      const events: SegmentEvent[] = [
        // Invalid Event
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            email: 'gk@gmail.com'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            external_id: 'Xi1234'
          }
        })
      ]

      const response = await testDestination.executeBatch('trackEvent', {
        events,
        settings,
        mapping
      })

      // The first doesn't fail as there is no error reported by Klaviyo API
      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'Invalid input',
        sent: {
          profile: {
            email: 'gk@gmail.com'
          },
          metric_name: 'Test Event',
          properties: {
            email: 'gk@gmail.com'
          },
          time: timestamp
        },
        body: '{"id":"752f7ece-af20-44e0-aa3a-b13290d98e72","status":400,"code":"invalid","title":"Invalid input.","detail":"Invalid input","source":{"pointer":"/data/attributes/events-bulk-create/data/0/attributes/email"},"links":{},"meta":{}}'
      })

      // The second event fails as Klaviyo API reports an error
      expect(response[1]).toMatchObject({
        status: 429,
        sent: {
          profile: {
            external_id: 'Xi1234'
          },
          metric_name: 'Test Event',
          properties: {
            external_id: 'Xi1234'
          },
          time: timestamp
        },
        body: 'Retry'
      })
    })

    it('should successfully handle a batch when all payload is invalid', async () => {
      const events: SegmentEvent[] = [
        // Event with invalid phone_number
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            country_code: 'IN',
            phone_number: '701271',
            email: 'valid@gmail.com'
          }
        }),
        // Event without any user identifier
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {}
        })
      ]

      const response = await testDestination.executeBatch('trackEvent', {
        events,
        settings,
        mapping
      })

      // The First event fails as pre-request validation fails for having invalid phone_number and could not be converted to E164 format
      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Phone number could not be converted to E.164 format.',
        errorreporter: 'DESTINATION'
      })

      // The second event fails as pre-request validation fails for not having any user identifier
      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of External ID, Anonymous ID, Phone Number or Email is required.',
        errorreporter: 'DESTINATION'
      })
    })
  })
})
