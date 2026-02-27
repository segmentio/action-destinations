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

// 13 empty strings for unmapped PII fields: phone, year, month, day, last, first, firstInitial, gender, city, state, zip, country, mobileAdId
const EMPTY_TAIL = ['', '', '', '', '', '', '', '', '', '', '', '', '']

describe('FacebookCustomAudiences.sync - syncMode: delete', () => {
  beforeEach(() => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
  })

  describe('executeBatch', () => {
    it('should delete a batch of users successfully', async () => {
      // --- Segment Events ---
      const events = [
        createTestEvent({ userId: 'user-1', properties: { email: 'user1@example.com' } }),
        createTestEvent({ userId: 'user-2', properties: { email: 'user2@example.com' } }),
        createTestEvent({ userId: 'user-3', properties: { email: 'user3@example.com' } })
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
        mapping
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
        createTestEvent({ userId: 'user-1', properties: { email: 'user1@example.com' } }),
        createTestEvent({ userId: 'user-2', properties: { email: 'user2@example.com' } }),
        createTestEvent({ userId: 'user-3', properties: { email: 'user3@example.com' } })
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
          message: 'Invalid parameter',
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
        mapping
      })

      // --- Expected Segment MultiStatus Response ---
      expect(responses.length).toBe(3)

      const expectedError = {
        status: 400,
        errortype: 'UNKNOWN_ERROR',
        errormessage: 'Invalid parameter',
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
        createTestEvent({ userId: 'user-1', properties: { email: 'user1@example.com' } }),
        createTestEvent({ userId: 'user-2', properties: { email: 'user2@example.com' } })
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
        mapping
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
})
