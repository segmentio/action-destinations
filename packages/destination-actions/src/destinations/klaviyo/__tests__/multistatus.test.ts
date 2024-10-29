import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { API_URL } from '../config'
import Braze from '../index'

beforeEach(() => nock.cleanAll())

const testDestination = createTestIntegration(Braze)

const settings = {
  api_key: 'my-api-key'
}

const timestamp = '2024-07-22T20:08:49.7931Z'

describe('MultiStatus', () => {
  describe('addProfileToList', () => {
    beforeEach(() => {
      nock.cleanAll()
      jest.resetAllMocks()
    })
    afterEach(() => {
      jest.resetAllMocks()
    })
    const mapping = {
      email: {
        '@path': '$.properties.email'
      },
      phone_number: {
        '@path': '$.properties.phone_number'
      },
      first_name: {
        '@path': '$.properties.firstName'
      },
      last_name: {
        '@path': '$.properties.lastName'
      },
      list_id: {
        '@path': '$.properties.list_id'
      },
      properties: {
        '@path': '$.properties'
      },
      country_code: {
        '@path': '$.properties.country_code'
      },
      external_id: {
        '@path': '$.properties.external_id'
      }
    }

    it("should successfully handle those payload where phone_number is invalid and couldn't be converted to E164 format", async () => {
      nock(API_URL).post('/profile-bulk-import-jobs/').reply(202, {})

      const events: SegmentEvent[] = [
        // Event with invalid phone_number
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            country_code: 'IN',
            phone_number: '701271',
            email: 'valid@gmail.com',
            list_id: '123'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            email: 'valid@gmail.com',
            list_id: '123'
          }
        })
      ]

      const response = await testDestination.executeBatch('addProfileToList', {
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
      nock(API_URL).post('/profile-bulk-import-jobs/').reply(200, { success: true })

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            email: 'valid@gmail.com',
            list_id: '123'
          }
        }),
        // Event without any user identifier
        createTestEvent({
          type: 'track',
          properties: {
            list_id: '123'
          }
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

      const response = await testDestination.executeBatch('addProfileToList', {
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
        errormessage: 'One of External ID, Phone Number or Email is required.',
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
              pointer: '/data/attributes/profiles/data/0/attributes/email'
            },
            links: {},
            meta: {}
          }
        ]
      }
      nock(API_URL).post('/profile-bulk-import-jobs/').reply(400, mockResponse)

      const events: SegmentEvent[] = [
        // Invalid Event
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            email: 'gk@gmail.com',
            list_id: '123'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            external_id: 'Xi1234',
            list_id: '123'
          }
        })
      ]

      const response = await testDestination.executeBatch('addProfileToList', {
        events,
        settings,
        mapping
      })

      // The first doesn't fail as there is no error reported by Braze API
      expect(response[0]).toMatchObject({
        status: 400,
        errormessage: 'Bad Request',
        sent: {
          email: 'gk@gmail.com',
          list_id: '123',
          properties: {
            email: 'gk@gmail.com',
            list_id: '123'
          }
        },
        body: '{"errors":[{"id":"752f7ece-af20-44e0-aa3a-b13290d98e72","status":400,"code":"invalid","title":"Invalid input.","detail":"Invalid input","source":{"pointer":"/data/attributes/profiles/data/0/attributes/email"},"links":{},"meta":{}}]}',
        errortype: 'BAD_REQUEST',
        errorreporter: 'DESTINATION'
      })

      // // The second event fails as Braze API reports an error
      expect(response[1]).toMatchObject({
        status: 400,
        errormessage: 'Bad Request',
        sent: {
          list_id: '123',
          properties: {
            external_id: 'Xi1234',
            list_id: '123'
          },
          external_id: 'Xi1234'
        },
        body: '{"errors":[{"id":"752f7ece-af20-44e0-aa3a-b13290d98e72","status":400,"code":"invalid","title":"Invalid input.","detail":"Invalid input","source":{"pointer":"/data/attributes/profiles/data/0/attributes/email"},"links":{},"meta":{}}]}',
        errortype: 'BAD_REQUEST',
        errorreporter: 'DESTINATION'
      })
    })

    it('should successfully handle a batch when all payload is invalid', async () => {
      const events: SegmentEvent[] = [
        // Event with invalid phone_number
        createTestEvent({
          type: 'track',
          properties: {
            country_code: 'IN',
            phone_number: '701271',
            email: 'valid@gmail.com',
            list_id: '123'
          }
        }),
        // Event without any user identifier
        createTestEvent({
          type: 'track',
          properties: { list_id: '123' }
        })
      ]

      const response = await testDestination.executeBatch('addProfileToList', {
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
        errormessage: 'One of External ID, Phone Number or Email is required.',
        errorreporter: 'DESTINATION'
      })
    })
  })
})
