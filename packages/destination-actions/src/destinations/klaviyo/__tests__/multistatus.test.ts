import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { API_URL } from '../config'
import Klaviyo from '../index'

beforeEach(() => nock.cleanAll())

const testDestination = createTestIntegration(Klaviyo)

const settings = {
  api_key: 'my-api-key'
}
const listId = 'XYZABC'

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
        errorreporter: 'INTEGRATIONS'
      })

      // The Second event doesn't fail as there is no error reported by Klaviyo API
      expect(response[1]).toMatchObject({
        status: 200,
        body: '{}'
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
        body: '{}'
      })

      // The second event fails as pre-request validation fails for not having any user identifier
      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of External ID, Anonymous ID, Phone Number or Email is required.',
        errorreporter: 'INTEGRATIONS'
      })
      // The third event fails as pre-request validation fails for having invalid email
      expect(response[2]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Email must be a valid email address string but it was not.',
        errorreporter: 'INTEGRATIONS'
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
        errorreporter: 'INTEGRATIONS'
      })

      // The second event fails as pre-request validation fails for not having any user identifier
      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of External ID, Anonymous ID, Phone Number or Email is required.',
        errorreporter: 'INTEGRATIONS'
      })
    })
  })
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
    const responseData = {
      data: {
        type: 'profile-bulk-import-job',
        id: 'ZXo4dlZ1X21haW50ZW5hbmNlLnRNMm5PYy4xNzMxOTQxODcyLmhibkMzZw',
        attributes: {
          status: 'queued',
          created_at: '2024-11-18T14:57:52.454354+00:00',
          total_count: 1,
          completed_count: 0,
          failed_count: 0,
          completed_at: null,
          expires_at: '2024-11-25T14:57:52.454354+00:00',
          started_at: null
        },
        relationships: {
          lists: {
            data: [
              {
                type: 'list',
                id: 'WNyUbB'
              }
            ]
          }
        }
      }
    }

    it("should successfully handle those payload where phone_number is invalid and couldn't be converted to E164 format", async () => {
      nock(API_URL).post('/profile-bulk-import-jobs/').reply(202, responseData)

      const events: SegmentEvent[] = [
        // Event with invalid phone_number
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            country_code: 'IN',
            phone_number: '701271',
            email: 'valid@gmail.com',
            list_id: 'WNyUbB'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            email: 'valid@gmail.com',
            list_id: 'WNyUbB'
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
        errorreporter: 'INTEGRATIONS'
      })

      // The Second event doesn't fail as there is no error reported by Klaviyo API
      expect(response[1]).toMatchObject({
        status: 200,
        body: JSON.stringify(responseData)
      })
    })

    it('should successfully handle a batch of events with complete success response from Klaviyo API', async () => {
      nock(API_URL).post('/profile-bulk-import-jobs/').reply(200, responseData)

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            email: 'valid@gmail.com',
            list_id: 'WNyUbB'
          }
        }),
        // Event without any user identifier
        createTestEvent({
          type: 'track',
          properties: {
            list_id: 'WNyUbB'
          }
        }),
        //Event with invalid Email
        createTestEvent({
          type: 'track',
          timestamp,
          properties: {
            email: 'invalid_email@gmail..com',
            list_id: 'WNyUbB'
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
        body: JSON.stringify(responseData)
      })

      // The second event fails as pre-request validation fails for not having any user identifier
      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of External ID, Phone Number or Email is required.',
        errorreporter: 'INTEGRATIONS'
      })

      // The third event fails as pre-request validation fails for having invalid email
      expect(response[2]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Email must be a valid email address string but it was not.',
        errorreporter: 'INTEGRATIONS'
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
        errorreporter: 'INTEGRATIONS'
      })

      // The second event fails as pre-request validation fails for not having any user identifier
      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of External ID, Phone Number or Email is required.',
        errorreporter: 'INTEGRATIONS'
      })
    })
  })
  describe('removeProfile', () => {
    beforeEach(() => {
      nock.cleanAll()
      jest.resetAllMocks()
    })
    afterEach(() => {
      jest.resetAllMocks()
    })
    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'XYZABC'
        },
        { type: 'profile', id: 'XYZABD' }
      ]
    }
    const mapping = {
      email: {
        '@path': '$.traits.email'
      },
      phone_number: {
        '@path': '$.traits.phone_number'
      },
      list_id: {
        '@path': '$.traits.list_id'
      },
      country_code: {
        '@path': '$.traits.country_code'
      },
      external_id: {
        '@path': '$.traits.external_id'
      }
    }

    it("should successfully handle those payload where phone_number is invalid and couldn't be converted to E164 format", async () => {
      nock(`${API_URL}/profiles`)
        .get(`/?filter=any(email,["valid@gmail.com"])`)
        .reply(200, {
          data: [{ id: 'XYZABC' }]
        })
      const requestBody = {
        data: [
          {
            type: 'profile',
            id: 'XYZABC'
          }
        ]
      }

      nock(API_URL).delete(`/lists/${listId}/relationships/profiles/`, requestBody).reply(202, {})

      const events: SegmentEvent[] = [
        // Event with invalid phone_number
        createTestEvent({
          type: 'identify',
          timestamp,
          traits: {
            country_code: 'IN',
            phone_number: '701271',
            email: 'valid+1@gmail.com',
            list_id: listId
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'identify',
          timestamp,
          traits: {
            email: 'valid@gmail.com',
            list_id: listId
          }
        })
      ]

      const response = await testDestination.executeBatch('removeProfile', {
        events,
        settings,
        mapping
      })

      // The First event fails as pre-request validation fails for having invalid phone_number and could not be converted to E164 format
      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Phone number could not be converted to E.164 format.',
        errorreporter: 'INTEGRATIONS'
      })

      // The Second event doesn't fail as there is no error reported by Klaviyo API
      expect(response[1]).toMatchObject({
        status: 200,
        body: '{}'
      })
    })

    it('should successfully handle a batch of events with complete success response from Klaviyo API', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'identify',
          traits: {
            country_code: 'IN',
            phone_number: '7012716787',
            list_id: listId
          }
        }),
        createTestEvent({
          type: 'identify',
          traits: {
            email: 'user1@example.com',
            list_id: listId
          }
        }),
        createTestEvent({
          type: 'identify',
          traits: {
            external_id: 'externalId2',
            list_id: listId
          }
        })
      ]

      nock(`${API_URL}/profiles`)
        .get(`/?filter=any(email,["user1@example.com"])`)
        .reply(200, {
          data: [{ id: 'XYZABC' }]
        })

      nock(`${API_URL}/profiles`)
        .get(`/?filter=any(external_id,["externalId2"])`)
        .reply(200, {
          data: [{ id: 'XYZABD' }]
        })

      nock(`${API_URL}/profiles`)
        .get(`/?filter=any(phone_number,["+917012716787"])`)
        .reply(200, {
          data: [{ id: 'ABCXYZ' }]
        })

      const requestBody = {
        data: [
          { type: 'profile', id: 'XYZABD' },
          {
            type: 'profile',
            id: 'XYZABC'
          },
          { type: 'profile', id: 'ABCXYZ' }
        ]
      }

      nock(`${API_URL}/lists/${listId}`).delete('/relationships/profiles/', requestBody).reply(200, {})

      const response = await testDestination.executeBatch('removeProfile', {
        settings,
        events,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 200,
        body: '{}'
      })
      expect(response[1]).toMatchObject({
        status: 200,
        body: '{}'
      })
      expect(response[1]).toMatchObject({
        status: 200,
        body: '{}'
      })
    })

    it('should successfully handle a batch of events with failure response from Klaviyo API', async () => {
      // Mocking a 400 response from Klaviyo API
      const mockResponse = {
        errors: [
          {
            id: 'cd962f40-31ae-4830-a5a1-7ab08a2a222e',
            status: 400,
            code: 'invalid',
            title: 'Invalid input.',
            detail: 'Invalid profile IDs: XYZABD',
            source: {
              pointer: '/data/'
            }
          }
        ]
      }
      nock(`${API_URL}`)
        .get('/profiles/')
        .query({
          filter: 'any(email,["user1@example.com","user2@example.com"])'
        })
        .reply(200, {
          data: [{ id: 'XYZABC' }, { id: 'XYZABD' }]
        })
      nock(`${API_URL}/lists/${listId}`).delete('/relationships/profiles/', requestBody).reply(400, mockResponse)

      const events: SegmentEvent[] = [
        // Invalid Event
        createTestEvent({
          type: 'identify',
          timestamp,
          traits: {
            email: 'user1@example.com',
            list_id: listId
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'identify',
          timestamp,
          traits: {
            email: 'user2@example.com',
            list_id: listId
          }
        })
      ]

      const response = await testDestination.executeBatch('removeProfile', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 400,
        errormessage: 'Bad Request',
        sent: { email: 'user1@example.com', list_id: listId },
        body: '{"errors":[{"id":"cd962f40-31ae-4830-a5a1-7ab08a2a222e","status":400,"code":"invalid","title":"Invalid input.","detail":"Invalid profile IDs: XYZABD","source":{"pointer":"/data/"}}]}',
        errortype: 'BAD_REQUEST',
        errorreporter: 'DESTINATION'
      })

      expect(response[1]).toMatchObject({
        status: 400,
        errormessage: 'Bad Request',
        sent: { email: 'user2@example.com', list_id: listId },
        body: '{"errors":[{"id":"cd962f40-31ae-4830-a5a1-7ab08a2a222e","status":400,"code":"invalid","title":"Invalid input.","detail":"Invalid profile IDs: XYZABD","source":{"pointer":"/data/"}}]}',
        errortype: 'BAD_REQUEST',
        errorreporter: 'DESTINATION'
      })
    })

    it('should successfully handle a batch when all payload is invalid', async () => {
      const events: SegmentEvent[] = [
        // Event with invalid phone_number
        createTestEvent({
          type: 'identify',
          traits: {
            country_code: 'IN',
            phone_number: '701271',
            email: 'valid@gmail.com',
            list_id: listId
          }
        }),
        // Event without any user identifier
        createTestEvent({
          type: 'identify',
          traits: { list_id: listId }
        })
      ]

      const response = await testDestination.executeBatch('removeProfile', {
        events,
        settings,
        mapping
      })

      // The First event fails as pre-request validation fails for having invalid phone_number and could not be converted to E164 format
      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Phone number could not be converted to E.164 format.',
        errorreporter: 'INTEGRATIONS'
      })

      // The second event fails as pre-request validation fails for not having any user identifier
      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of External ID, Phone Number or Email is required.',
        errorreporter: 'INTEGRATIONS'
      })
    })
  })

  describe('removeProfileFromList', () => {
    beforeEach(() => {
      nock.cleanAll()
      jest.resetAllMocks()
    })
    afterEach(() => {
      jest.resetAllMocks()
    })
    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'XYZABC'
        },
        { type: 'profile', id: 'XYZABD' }
      ]
    }
    const mapping = {
      email: {
        '@path': '$.properties.email'
      },
      phone_number: {
        '@path': '$.properties.phone_number'
      },
      list_id: listId,
      country_code: {
        '@path': '$.properties.country_code'
      },
      external_id: {
        '@path': '$.properties.external_id'
      }
    }

    it("should successfully handle those payload where phone_number is invalid and couldn't be converted to E164 format", async () => {
      nock(`${API_URL}/profiles`)
        .get(`/?filter=any(email,["valid@gmail.com"])`)
        .reply(200, {
          data: [{ id: 'XYZABC' }]
        })
      const requestBody = {
        data: [
          {
            type: 'profile',
            id: 'XYZABC'
          }
        ]
      }

      nock(API_URL).delete(`/lists/${listId}/relationships/profiles/`, requestBody).reply(202, {})

      const events: SegmentEvent[] = [
        // Event with invalid phone_number
        createTestEvent({
          type: 'track',
          event: 'Audience Exited',
          timestamp,
          properties: {
            country_code: 'IN',
            phone_number: '701271',
            email: 'valid+1@gmail.com'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'track',
          event: 'Audience Exited',
          timestamp,
          properties: {
            email: 'valid@gmail.com'
          }
        })
      ]

      const response = await testDestination.executeBatch('removeProfileFromList', {
        events,
        settings,
        mapping
      })

      // The First event fails as pre-request validation fails for having invalid phone_number and could not be converted to E164 format
      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Phone number could not be converted to E.164 format.',
        errorreporter: 'INTEGRATIONS'
      })

      // The Second event doesn't fail as there is no error reported by Klaviyo API
      expect(response[1]).toMatchObject({
        status: 200,
        body: '{}'
      })
    })

    it('should successfully handle a batch of events with complete success response from Klaviyo API', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'track',
          event: 'Audience Exited',
          properties: {
            country_code: 'IN',
            phone_number: '7012716787'
          }
        }),
        createTestEvent({
          type: 'track',
          event: 'Audience Exited',
          properties: {
            email: 'user1@example.com'
          }
        }),
        createTestEvent({
          type: 'track',
          event: 'Audience Exited',
          properties: {
            external_id: 'externalId2'
          }
        })
      ]

      nock(`${API_URL}/profiles`)
        .get(`/?filter=any(email,["user1@example.com"])`)
        .reply(200, {
          data: [{ id: 'XYZABC' }]
        })

      nock(`${API_URL}/profiles`)
        .get(`/?filter=any(external_id,["externalId2"])`)
        .reply(200, {
          data: [{ id: 'XYZABD' }]
        })

      nock(`${API_URL}/profiles`)
        .get(`/?filter=any(phone_number,["+917012716787"])`)
        .reply(200, {
          data: [{ id: 'ABCXYZ' }]
        })

      const requestBody = {
        data: [
          { type: 'profile', id: 'XYZABD' },
          {
            type: 'profile',
            id: 'XYZABC'
          },
          { type: 'profile', id: 'ABCXYZ' }
        ]
      }

      nock(`${API_URL}/lists/${listId}`).delete('/relationships/profiles/', requestBody).reply(200, {})

      const response = await testDestination.executeBatch('removeProfileFromList', {
        settings,
        events,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 200,
        body: '{}'
      })
      expect(response[1]).toMatchObject({
        status: 200,
        body: '{}'
      })
      expect(response[1]).toMatchObject({
        status: 200,
        body: '{}'
      })
    })

    it('should successfully handle a batch of events with failure response from Klaviyo API', async () => {
      // Mocking a 400 response from Klaviyo API
      const mockResponse = {
        errors: [
          {
            id: 'cd962f40-31ae-4830-a5a1-7ab08a2a222e',
            status: 400,
            code: 'invalid',
            title: 'Invalid input.',
            detail: 'Invalid profile IDs: XYZABD',
            source: {
              pointer: '/data/'
            }
          }
        ]
      }
      nock(`${API_URL}`)
        .get('/profiles/')
        .query({
          filter: 'any(email,["user1@example.com","user2@example.com"])'
        })
        .reply(200, {
          data: [{ id: 'XYZABC' }, { id: 'XYZABD' }]
        })
      nock(`${API_URL}/lists/${listId}`).delete('/relationships/profiles/', requestBody).reply(400, mockResponse)

      const events: SegmentEvent[] = [
        // Invalid Event
        createTestEvent({
          type: 'track',
          event: 'Audience Exited',
          timestamp,
          properties: {
            email: 'user1@example.com'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'track',
          event: 'Audience Exited',
          timestamp,
          properties: {
            email: 'user2@example.com'
          }
        })
      ]

      const response = await testDestination.executeBatch('removeProfileFromList', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 400,
        errormessage: 'Bad Request',
        sent: { email: 'user1@example.com', list_id: listId },
        body: '{"errors":[{"id":"cd962f40-31ae-4830-a5a1-7ab08a2a222e","status":400,"code":"invalid","title":"Invalid input.","detail":"Invalid profile IDs: XYZABD","source":{"pointer":"/data/"}}]}',
        errortype: 'BAD_REQUEST',
        errorreporter: 'DESTINATION'
      })

      expect(response[1]).toMatchObject({
        status: 400,
        errormessage: 'Bad Request',
        sent: { email: 'user2@example.com', list_id: listId },
        body: '{"errors":[{"id":"cd962f40-31ae-4830-a5a1-7ab08a2a222e","status":400,"code":"invalid","title":"Invalid input.","detail":"Invalid profile IDs: XYZABD","source":{"pointer":"/data/"}}]}',
        errortype: 'BAD_REQUEST',
        errorreporter: 'DESTINATION'
      })
    })

    it('should successfully handle a batch when all payload is invalid', async () => {
      const events: SegmentEvent[] = [
        // Event with invalid phone_number
        createTestEvent({
          type: 'track',
          event: 'Audience Exited',
          properties: {
            country_code: 'IN',
            phone_number: '701271',
            email: 'valid@gmail.com'
          }
        }),
        // Event without any user identifier
        createTestEvent({
          type: 'track',
          event: 'Audience Exited',
          properties: {}
        })
      ]

      const response = await testDestination.executeBatch('removeProfileFromList', {
        events,
        settings,
        mapping
      })

      // The First event fails as pre-request validation fails for having invalid phone_number and could not be converted to E164 format
      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Phone number could not be converted to E.164 format.',
        errorreporter: 'INTEGRATIONS'
      })

      // The second event fails as pre-request validation fails for not having any user identifier
      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of External ID, Phone Number or Email is required.',
        errorreporter: 'INTEGRATIONS'
      })
    })
    it('should successfully mark the payload as success when there is no profileIds', async () => {
      nock(`${API_URL}/profiles`)
        .get(`/?filter=any(email,["valid@gmail.com","valid+1@gmail.com"])`)
        .reply(200, { data: [] })

      const events: SegmentEvent[] = [
        // Event with invalid phone_number
        createTestEvent({
          type: 'track',
          event: 'Audience Exited',
          timestamp,
          properties: {
            email: 'valid@gmail.com'
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'track',
          event: 'Audience Exited',
          timestamp,
          properties: {
            email: 'valid+1@gmail.com'
          }
        })
      ]

      const response = await testDestination.executeBatch('removeProfileFromList', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 200,
        body: 'success'
      })

      expect(response[1]).toMatchObject({
        status: 200,
        body: 'success'
      })
    })
  })
})
