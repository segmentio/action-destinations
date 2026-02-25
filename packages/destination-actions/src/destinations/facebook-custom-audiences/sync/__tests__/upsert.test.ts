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

describe('FacebookCustomAudiences.sync - syncMode: upsert', () => {
  beforeEach(() => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
  })

  describe('executeBatch', () => {
    it('should upsert a batch of users successfully', async () => {
      // --- Segment Events ---
      const events = [
        createTestEvent({ userId: 'user-1', properties: { email: 'user1@example.com' } }),
        createTestEvent({ userId: 'user-2', properties: { email: 'user2@example.com' } }),
        createTestEvent({ userId: 'user-3', properties: { email: 'user3@example.com' } })
      ]

      // --- Mapping ---
      const mapping = {
        __segment_internal_sync_mode: 'upsert',
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
        .post(`/${AUDIENCE_ID}/users`, expectedFacebookBody)
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
          method: 'POST',
          data: ['user-1', 'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', ...EMPTY_TAIL]
        }
      })

      expect(responses[1]).toMatchObject({
        status: 200,
        body: { externalId: 'user-2', email: 'user2@example.com', enable_batching: true, batch_size: 10000 },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'POST',
          data: ['user-2', '2b3b2b9ce842ab8b6a6c614cb1f9604bb8a0d502d1af49c526b72b10894e95b5', ...EMPTY_TAIL]
        }
      })

      expect(responses[2]).toMatchObject({
        status: 200,
        body: { externalId: 'user-3', email: 'user3@example.com', enable_batching: true, batch_size: 10000 },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'POST',
          data: ['user-3', '898628e28890f937bdf009391def42879c401a4bcf1b5fd24e738d9f5da8cbbb', ...EMPTY_TAIL]
        }
      })
    })

    it('should upsert a single user with all PII fields populated', async () => {
      // --- Segment Event ---
      const events = [
        createTestEvent({
          userId: 'user-full',
          properties: {
            email: 'user1@example.com',
            phone: '+1-555-123-4567',
            birthday_year: '1990',
            birthday_month: '01',
            birthday_day: '15',
            first_name: 'John',
            last_name: 'Doe',
            first_initial: 'J',
            gender: 'male',
            city: 'San Francisco',
            state: 'California',
            zip_code: '92000',
            country: 'US',
            madid: 'AB12CD-E345-FG67',
            app_id: 'app123'
          }
        })
      ]

      // --- Mapping (all PII fields) ---
      const mapping = {
        __segment_internal_sync_mode: 'upsert',
        externalId: { '@path': '$.userId' },
        email: { '@path': '$.properties.email' },
        phone: { '@path': '$.properties.phone' },
        birth: {
          year: { '@path': '$.properties.birthday_year' },
          month: { '@path': '$.properties.birthday_month' },
          day: { '@path': '$.properties.birthday_day' }
        },
        name: {
          first: { '@path': '$.properties.first_name' },
          last: { '@path': '$.properties.last_name' },
          firstInitial: { '@path': '$.properties.first_initial' }
        },
        gender: { '@path': '$.properties.gender' },
        city: { '@path': '$.properties.city' },
        state: { '@path': '$.properties.state' },
        zip: { '@path': '$.properties.zip_code' },
        country: { '@path': '$.properties.country' },
        mobileAdId: { '@path': '$.properties.madid' },
        appId: { '@path': '$.properties.app_id' },
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
      const fullDataRow = [
        'user-full',
        'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', // email: user1@example.com
        'd6736136ea896c1bfdc553e0e86e702c70d060d805696ca3e4e9e0961353860a', // phone: +1-555-123-4567 -> 15551234567
        'a7be8e1fe282a37cd666e0632b17d933fa13f21addf4798fc0455bc166e2488c', // year: 1990
        '938db8c9f82c8cb58d3f3ef4fd250036a48d26a712753d2fde5abd03a85cabf4', // month: 01
        'e629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d8bdb', // day: 15
        '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f', // last: Doe -> doe
        '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a', // first: John -> john
        '189f40034be7a199f1fa9891668ee3ab6049f82d38c68be70f596eab2e1857b7', // firstInitial: J -> j
        '62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a', // gender: male -> m
        '1a6bd4d9d79dc0a79b53795c70d3349fa9e38968a3fbefbfe8783efb1d2b6aac', // city: San Francisco -> sanfrancisco
        '6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126', // state: California -> ca
        'ad16c1a6866c5887c5b59c1803cb1fc09769f1b403b6f1d9d0f10ad6ab4d5d50', // zip: 92000
        '79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621', // country: US -> us
        'AB12CD-E345-FG67' // mobileAdId (not hashed)
      ]

      const expectedFacebookBody = {
        payload: {
          schema: SCHEMA_PROPERTIES,
          data: [fullDataRow],
          app_ids: ['app123']
        }
      }

      // --- Facebook Response ---
      const facebookResponse = {
        audience_id: AUDIENCE_ID,
        session_id: '123456789',
        num_received: 1,
        num_invalid_entries: 0,
        invalid_entry_samples: {}
      }

      nock(`${BASE_URL}/${API_VERSION}`)
        .post(`/${AUDIENCE_ID}/users`, expectedFacebookBody)
        .reply(200, facebookResponse)

      // --- Execute ---
      const responses = await testDestination.executeBatch('sync', {
        events,
        settings,
        auth,
        mapping
      })

      // --- Expected Segment MultiStatus Response ---
      expect(responses.length).toBe(1)

      expect(responses[0]).toMatchObject({
        status: 200,
        body: {
          externalId: 'user-full',
          email: 'user1@example.com',
          phone: '+1-555-123-4567',
          birth: { year: '1990', month: '01', day: '15' },
          name: { first: 'John', last: 'Doe', firstInitial: 'J' },
          gender: 'male',
          city: 'San Francisco',
          state: 'California',
          zip: '92000',
          country: 'US',
          mobileAdId: 'AB12CD-E345-FG67',
          appId: 'app123',
          enable_batching: true,
          batch_size: 10000
        },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'POST',
          data: fullDataRow
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
        __segment_internal_sync_mode: 'upsert',
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
        .post(`/${AUDIENCE_ID}/users`, expectedFacebookBody)
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
        errortype: 'OAuthException',
        errormessage: 'Invalid parameter (code: 400)',
        errorreporter: 'DESTINATION'
      }

      expect(responses[0]).toMatchObject({
        ...expectedError,
        body: { externalId: 'user-1', email: 'user1@example.com', enable_batching: true, batch_size: 10000 },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'POST',
          data: ['user-1', 'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', ...EMPTY_TAIL]
        }
      })

      expect(responses[1]).toMatchObject({
        ...expectedError,
        body: { externalId: 'user-2', email: 'user2@example.com', enable_batching: true, batch_size: 10000 },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'POST',
          data: ['user-2', '2b3b2b9ce842ab8b6a6c614cb1f9604bb8a0d502d1af49c526b72b10894e95b5', ...EMPTY_TAIL]
        }
      })

      expect(responses[2]).toMatchObject({
        ...expectedError,
        body: { externalId: 'user-3', email: 'user3@example.com', enable_batching: true, batch_size: 10000 },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'POST',
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
        __segment_internal_sync_mode: 'upsert',
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
