import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_VERSION, BASE_URL } from '../../constants'
import { SCHEMA_PROPERTIES } from '../constants'

let testDestination = createTestIntegration(Destination)

const auth = {
  accessToken: '123',
  refreshToken: '321'
}

const settings = {
  retlAdAccountId: '123'
}

const AUDIENCE_ID = '900'
const ENGAGE_AUDIENCE_ID = '1234'
const AUDIENCE_KEY = 'my_audience'

// 13 empty strings for unmapped PII fields: phone, year, month, day, last, first, firstInitial, gender, city, state, zip, country, mobileAdId
const EMPTY_TAIL = ['', '', '', '', '', '', '', '', '', '', '', '', '']

// Engage mapping - reads audience ID from event context, membership from traits
const engageMapping = {
  __segment_internal_sync_mode: 'delete',
  externalId: { '@path': '$.userId' },
  email: { '@path': '$.traits.email' },
  external_audience_id: { '@path': '$.context.personas.external_audience_id' },
  retlOnMappingSave: {
    inputs: {},
    outputs: {}
  },
  enable_batching: true,
  batch_size: 10000
}

// Helper to create an Engage identify event
function makeEngageEvent(email: string, userId: string, isMember: boolean) {
  return createTestEvent({
    type: 'identify',
    userId,
    traits: { email, [AUDIENCE_KEY]: isMember },
    context: {
      personas: {
        external_audience_id: ENGAGE_AUDIENCE_ID,
        computation_class: 'audience',
        computation_key: AUDIENCE_KEY
      }
    }
  })
}

describe('FacebookCustomAudiences.sync - syncMode: delete', () => {
  beforeEach(() => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
  })

  describe('executeBatch', () => {
    describe('RETL payloads', () => {
      it('should delete a batch of users successfully', async () => {
        // --- Segment Events ---
        const events = [
          createTestEvent({ type: 'track', event: 'deleted', userId: 'user-1', properties: { email: 'user1@example.com' } }),
          createTestEvent({ type: 'track', event: 'deleted', userId: 'user-2', properties: { email: 'user2@example.com' } }),
          createTestEvent({ type: 'track', event: 'deleted', userId: 'user-3', properties: { email: 'user3@example.com' } })
        ]

        // --- Mapping ---
        const mapping = {
          __segment_internal_sync_mode: 'delete',
          externalId: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          retlOnMappingSave: {
            inputs: {},
            outputs: {
              audienceName: 'test-audience',
              audienceId: AUDIENCE_ID
            }
          },
          enable_batching: true,
          batch_size: 10000
        }

        // --- Expected Facebook Request Body ---
        const expectedFacebookBody = {
          payload: {
            schema: SCHEMA_PROPERTIES,
            data: [
              ['user-1', 'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', ...EMPTY_TAIL],
              ['user-2', '2b3b2b9ce842ab8b6a6c614cb1f9604bb8a0d502d1af49c526b72b10894e95b5', ...EMPTY_TAIL],
              ['user-3', '898628e28890f937bdf009391def42879c401a4bcf1b5fd24e738d9f5da8cbbb', ...EMPTY_TAIL]
            ]
          }
        }

        // --- Facebook Response ---
        const facebookResponse = {
          audience_id: AUDIENCE_ID,
          session_id: '123456789',
          num_received: 3,
          num_invalid_entries: 0,
          invalid_entry_samples: {}
        }

        nock(`${BASE_URL}/${API_VERSION}`)
          .delete(`/${AUDIENCE_ID}/users`, expectedFacebookBody)
          .reply(200, facebookResponse)

        // --- Execute ---
        const responses = await testDestination.executeBatch('sync', {
          events,
          settings,
          auth,
          mapping,
          features: { 'actions-core-audience-membership': true }
        })

        // --- Expected Segment MultiStatus Response ---
        expect(responses.length).toBe(3)

        expect(responses[0]).toMatchObject({
          status: 200,
          body: { externalId: 'user-1', email: 'user1@example.com', enable_batching: true, batch_size: 10000 },
          sent: {
            audienceId: AUDIENCE_ID,
            method: 'DELETE',
            data: ['user-1', 'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', ...EMPTY_TAIL]
          }
        })

        expect(responses[1]).toMatchObject({
          status: 200,
          body: { externalId: 'user-2', email: 'user2@example.com', enable_batching: true, batch_size: 10000 },
          sent: {
            audienceId: AUDIENCE_ID,
            method: 'DELETE',
            data: ['user-2', '2b3b2b9ce842ab8b6a6c614cb1f9604bb8a0d502d1af49c526b72b10894e95b5', ...EMPTY_TAIL]
          }
        })

        expect(responses[2]).toMatchObject({
          status: 200,
          body: { externalId: 'user-3', email: 'user3@example.com', enable_batching: true, batch_size: 10000 },
          sent: {
            audienceId: AUDIENCE_ID,
            method: 'DELETE',
            data: ['user-3', '898628e28890f937bdf009391def42879c401a4bcf1b5fd24e738d9f5da8cbbb', ...EMPTY_TAIL]
          }
        })
      })

      it('should return error responses for all users when Facebook API returns an error', async () => {
        // --- Segment Events ---
        const events = [
          createTestEvent({ type: 'track', event: 'deleted', userId: 'user-1', properties: { email: 'user1@example.com' } }),
          createTestEvent({ type: 'track', event: 'deleted', userId: 'user-2', properties: { email: 'user2@example.com' } }),
          createTestEvent({ type: 'track', event: 'deleted', userId: 'user-3', properties: { email: 'user3@example.com' } })
        ]

        // --- Mapping ---
        const mapping = {
          __segment_internal_sync_mode: 'delete',
          externalId: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          retlOnMappingSave: {
            inputs: {},
            outputs: {
              audienceName: 'test-audience',
              audienceId: AUDIENCE_ID
            }
          },
          enable_batching: true,
          batch_size: 10000
        }

        // --- Expected Facebook Request Body ---
        const expectedFacebookBody = {
          payload: {
            schema: SCHEMA_PROPERTIES,
            data: [
              ['user-1', 'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', ...EMPTY_TAIL],
              ['user-2', '2b3b2b9ce842ab8b6a6c614cb1f9604bb8a0d502d1af49c526b72b10894e95b5', ...EMPTY_TAIL],
              ['user-3', '898628e28890f937bdf009391def42879c401a4bcf1b5fd24e738d9f5da8cbbb', ...EMPTY_TAIL]
            ]
          }
        }

        // --- Facebook Error Response ---
        const facebookErrorResponse = {
          error: {
            message: "fbmessage: \"Invalid parameter\". message: \"Bad Request\". code: \"100\"",
            type: 'OAuthException',
            code: 100,
            fbtrace_id: 'AbcDeFgHiJk'
          }
        }

        nock(`${BASE_URL}/${API_VERSION}`)
          .delete(`/${AUDIENCE_ID}/users`, expectedFacebookBody)
          .reply(400, facebookErrorResponse)

        // --- Execute ---
        const responses = await testDestination.executeBatch('sync', {
          events,
          settings,
          auth,
          mapping,
          features: { 'actions-core-audience-membership': true }
        })

        // --- Expected Segment MultiStatus Response ---
        expect(responses.length).toBe(3)

        const expectedError = {
          status: 400,
          errortype: 'OAuthException',
          errormessage: "fbmessage: \"fbmessage: \"Invalid parameter\". message: \"Bad Request\". code: \"100\"\". message: \"Bad Request\". code: \"100\"",
          errorreporter: 'DESTINATION'
        }

        expect(responses[0]).toMatchObject({
          ...expectedError,
          body: { externalId: 'user-1', email: 'user1@example.com', enable_batching: true, batch_size: 10000 },
          sent: {
            audienceId: AUDIENCE_ID,
            method: 'DELETE',
            data: ['user-1', 'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', ...EMPTY_TAIL]
          }
        })

        expect(responses[1]).toMatchObject({
          ...expectedError,
          body: { externalId: 'user-2', email: 'user2@example.com', enable_batching: true, batch_size: 10000 },
          sent: {
            audienceId: AUDIENCE_ID,
            method: 'DELETE',
            data: ['user-2', '2b3b2b9ce842ab8b6a6c614cb1f9604bb8a0d502d1af49c526b72b10894e95b5', ...EMPTY_TAIL]
          }
        })

        expect(responses[2]).toMatchObject({
          ...expectedError,
          body: { externalId: 'user-3', email: 'user3@example.com', enable_batching: true, batch_size: 10000 },
          sent: {
            audienceId: AUDIENCE_ID,
            method: 'DELETE',
            data: ['user-3', '898628e28890f937bdf009391def42879c401a4bcf1b5fd24e738d9f5da8cbbb', ...EMPTY_TAIL]
          }
        })
      })

      it('should return validation error when audience ID is missing', async () => {
        // --- Segment Events ---
        const events = [
          createTestEvent({ type: 'track', event: 'deleted', userId: 'user-1', properties: { email: 'user1@example.com' } }),
          createTestEvent({ type: 'track', event: 'deleted', userId: 'user-2', properties: { email: 'user2@example.com' } })
        ]

        // --- Mapping (no audience ID - hook outputs are empty) ---
        const mapping = {
          __segment_internal_sync_mode: 'delete',
          externalId: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          retlOnMappingSave: {
            inputs: {},
            outputs: {}
          },
          enable_batching: true,
          batch_size: 10000
        }

        // --- Execute (no nock needed - validation fails before HTTP call) ---
        const responses = await testDestination.executeBatch('sync', {
          events,
          settings,
          auth,
          mapping,
          features: { 'actions-core-audience-membership': true }
        })

        // --- Expected Segment MultiStatus Response ---
        expect(responses.length).toBe(2)

        expect(responses[0]).toMatchObject({
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'Missing audience ID.',
          body: { externalId: 'user-1', email: 'user1@example.com', enable_batching: true, batch_size: 10000 }
        })

        expect(responses[1]).toMatchObject({
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'Missing audience ID.',
          body: { externalId: 'user-2', email: 'user2@example.com', enable_batching: true, batch_size: 10000 }
        })
      })
    })
    describe('Engage payloads', () => {
      it('should delete Engage users whose trait flag is false', async () => {
        // --- Segment Events ---
        const events = [
          makeEngageEvent('remove1@test.com', 'rm-1', false),
          makeEngageEvent('remove2@test.com', 'rm-2', false)
        ]

        // --- Expected Facebook DELETE Body ---
        const expectedFacebookBody = {
          payload: {
            schema: SCHEMA_PROPERTIES,
            data: [
              ['rm-1', '839277c6f396d28d375f8a65ae5d9f0d5e54925d7503767c9d7e0f239bfce56b', ...EMPTY_TAIL],
              ['rm-2', '8b0a92ab0ddc9e3f90d866912c856eec340390f665e029506ab740ef95c2c75a', ...EMPTY_TAIL]
            ]
          }
        }

        // --- Facebook Response ---
        nock(`${BASE_URL}/${API_VERSION}`)
          .delete(`/${ENGAGE_AUDIENCE_ID}/users`, expectedFacebookBody)
          .reply(200, { audience_id: ENGAGE_AUDIENCE_ID, num_received: 2, num_invalid_entries: 0, invalid_entry_samples: {} })

        // --- Execute ---
        const responses = await testDestination.executeBatch('sync', {
          events,
          settings,
          auth,
          mapping: engageMapping,
          features: { 'actions-core-audience-membership': true }
        })

        // --- Expected Segment MultiStatus Response ---
        expect(responses.length).toBe(2)

        expect(responses[0]).toMatchObject({
          status: 200,
          body: { externalId: 'rm-1', email: 'remove1@test.com', external_audience_id: ENGAGE_AUDIENCE_ID },
          sent: { audienceId: ENGAGE_AUDIENCE_ID, method: 'DELETE' }
        })

        expect(responses[1]).toMatchObject({
          status: 200,
          body: { externalId: 'rm-2', email: 'remove2@test.com', external_audience_id: ENGAGE_AUDIENCE_ID },
          sent: { audienceId: ENGAGE_AUDIENCE_ID, method: 'DELETE' }
        })
      })

      it('should add Engage users whose trait flag is true and delete those with false', async () => {
        // --- Segment Events ---
        const events = [
          makeEngageEvent('add1@test.com', 'add-1', true),
          makeEngageEvent('add2@test.com', 'add-2', true),
          makeEngageEvent('remove1@test.com', 'rm-1', false),
          makeEngageEvent('remove2@test.com', 'rm-2', false)
        ]

        // --- Expected Facebook POST Body (adds) ---
        const expectedAddBody = {
          payload: {
            schema: SCHEMA_PROPERTIES,
            data: [
              ['add-1', 'effe3148356c0668f1f2c19e9be26544dd7882baf23c863bdceabf5dc30ab769', ...EMPTY_TAIL],
              ['add-2', '4e695ab9c3779ecd2e487ba8707aec6371ff8953513bca0a6da8d4ade768f62d', ...EMPTY_TAIL]
            ]
          }
        }

        // --- Expected Facebook DELETE Body (removes) ---
        const expectedDeleteBody = {
          payload: {
            schema: SCHEMA_PROPERTIES,
            data: [
              ['rm-1', '839277c6f396d28d375f8a65ae5d9f0d5e54925d7503767c9d7e0f239bfce56b', ...EMPTY_TAIL],
              ['rm-2', '8b0a92ab0ddc9e3f90d866912c856eec340390f665e029506ab740ef95c2c75a', ...EMPTY_TAIL]
            ]
          }
        }

        // --- Facebook Responses ---
        nock(`${BASE_URL}/${API_VERSION}`)
          .post(`/${ENGAGE_AUDIENCE_ID}/users`, expectedAddBody)
          .reply(200, { audience_id: ENGAGE_AUDIENCE_ID, num_received: 2, num_invalid_entries: 0, invalid_entry_samples: {} })

        nock(`${BASE_URL}/${API_VERSION}`)
          .delete(`/${ENGAGE_AUDIENCE_ID}/users`, expectedDeleteBody)
          .reply(200, { audience_id: ENGAGE_AUDIENCE_ID, num_received: 2, num_invalid_entries: 0, invalid_entry_samples: {} })

        // --- Execute ---
        const responses = await testDestination.executeBatch('sync', {
          events,
          settings,
          auth,
          mapping: engageMapping,
          features: { 'actions-core-audience-membership': true }
        })

        // --- Expected Segment MultiStatus Response ---
        expect(responses.length).toBe(4)

        expect(responses[0]).toMatchObject({
          status: 200,
          body: { externalId: 'add-1', email: 'add1@test.com' },
          sent: { audienceId: ENGAGE_AUDIENCE_ID, method: 'POST' }
        })

        expect(responses[1]).toMatchObject({
          status: 200,
          body: { externalId: 'add-2', email: 'add2@test.com' },
          sent: { audienceId: ENGAGE_AUDIENCE_ID, method: 'POST' }
        })

        expect(responses[2]).toMatchObject({
          status: 200,
          body: { externalId: 'rm-1', email: 'remove1@test.com' },
          sent: { audienceId: ENGAGE_AUDIENCE_ID, method: 'DELETE' }
        })

        expect(responses[3]).toMatchObject({
          status: 200,
          body: { externalId: 'rm-2', email: 'remove2@test.com' },
          sent: { audienceId: ENGAGE_AUDIENCE_ID, method: 'DELETE' }
        })
      })

      it('should return error responses when Facebook API fails for Engage deletes', async () => {
        // --- Segment Events ---
        const events = [
          makeEngageEvent('remove1@test.com', 'rm-1', false),
          makeEngageEvent('remove2@test.com', 'rm-2', false)
        ]

        // --- Facebook Error Response ---
        const facebookErrorResponse = {
          error: {
            message: 'Invalid parameter',
            type: 'OAuthException',
            code: 100,
            fbtrace_id: 'AbcDeFgHiJk'
          }
        }

        nock(`${BASE_URL}/${API_VERSION}`)
          .delete(`/${ENGAGE_AUDIENCE_ID}/users`)
          .reply(400, facebookErrorResponse)

        // --- Execute ---
        const responses = await testDestination.executeBatch('sync', {
          events,
          settings,
          auth,
          mapping: engageMapping,
          features: { 'actions-core-audience-membership': true }
        })

        // --- Expected Segment MultiStatus Response ---
        expect(responses.length).toBe(2)

        const expectedError = {
          status: 400,
          errortype: 'OAuthException',
          errormessage: 'fbmessage: "Invalid parameter". message: "Bad Request". code: "100"',
          errorreporter: 'DESTINATION'
        }

        expect(responses[0]).toMatchObject({
          ...expectedError,
          body: { externalId: 'rm-1', email: 'remove1@test.com' },
          sent: { audienceId: ENGAGE_AUDIENCE_ID, method: 'DELETE' }
        })

        expect(responses[1]).toMatchObject({
          ...expectedError,
          body: { externalId: 'rm-2', email: 'remove2@test.com' },
          sent: { audienceId: ENGAGE_AUDIENCE_ID, method: 'DELETE' }
        })
      })

      it('should return validation error for Engage users when audience ID is missing', async () => {
        // --- Segment Events (Engage context but no external_audience_id) ---
        const events = [
          createTestEvent({
            type: 'identify',
            userId: 'rm-1',
            traits: { email: 'remove1@test.com', [AUDIENCE_KEY]: false },
            context: {
              personas: {
                computation_class: 'audience',
                computation_key: AUDIENCE_KEY
                // external_audience_id intentionally omitted
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'rm-2',
            traits: { email: 'remove2@test.com', [AUDIENCE_KEY]: false },
            context: {
              personas: {
                computation_class: 'audience',
                computation_key: AUDIENCE_KEY
              }
            }
          })
        ]

        // --- Execute (no nock needed - validation fails before HTTP call) ---
        const responses = await testDestination.executeBatch('sync', {
          events,
          settings,
          auth,
          mapping: engageMapping,
          features: { 'actions-core-audience-membership': true }
        })

        // --- Expected Segment MultiStatus Response ---
        expect(responses.length).toBe(2)

        expect(responses[0]).toMatchObject({
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'Missing audience ID.',
          body: { externalId: 'rm-1', email: 'remove1@test.com' }
        })

        expect(responses[1]).toMatchObject({
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'Missing audience ID.',
          body: { externalId: 'rm-2', email: 'remove2@test.com' }
        })
      })
    })
  })
})
