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

const ENGAGE_AUDIENCE_ID = '1234'
const AUDIENCE_KEY = 'my_audience'

// 13 empty strings for unmapped PII fields: phone, year, month, day, last, first, firstInitial, gender, city, state, zip, country, mobileAdId
const EMPTY_TAIL = ['', '', '', '', '', '', '', '', '', '', '', '', '']

// --- Engage Mapping (uses default field mappings) ---
const engageMapping = {
  __segment_internal_sync_mode: 'mirror',
  externalId: { '@path': '$.userId' },
  email: { '@path': '$.traits.email' },
  external_audience_id: { '@path': '$.context.personas.external_audience_id' },
  engage_fields: {
    traits_or_properties: {
      '@if': {
        exists: { '@path': '$.traits' },
        then: { '@path': '$.traits' },
        else: { '@path': '$.properties' }
      }
    },
    audience_key: { '@path': '$.context.personas.computation_key' },
    computation_class: { '@path': '$.context.personas.computation_class' }
  },
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
    traits: {
      email,
      [AUDIENCE_KEY]: isMember
    },
    context: {
      personas: {
        external_audience_id: ENGAGE_AUDIENCE_ID,
        computation_class: 'audience',
        computation_key: AUDIENCE_KEY
      }
    }
  })
}

describe('FacebookCustomAudiences.sync - syncMode: mirror', () => {
  beforeEach(() => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
  })

  describe('executeBatch', () => {
    it('should add and remove users in a batch successfully', async () => {
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
      const facebookAddResponse = {
        audience_id: ENGAGE_AUDIENCE_ID,
        session_id: '111111',
        num_received: 2,
        num_invalid_entries: 0,
        invalid_entry_samples: {}
      }

      const facebookDeleteResponse = {
        audience_id: ENGAGE_AUDIENCE_ID,
        session_id: '222222',
        num_received: 2,
        num_invalid_entries: 0,
        invalid_entry_samples: {}
      }

      nock(`${BASE_URL}/${API_VERSION}`)
        .post(`/${ENGAGE_AUDIENCE_ID}/users`, expectedAddBody)
        .reply(200, facebookAddResponse)

      nock(`${BASE_URL}/${API_VERSION}`)
        .delete(`/${ENGAGE_AUDIENCE_ID}/users`, expectedDeleteBody)
        .reply(200, facebookDeleteResponse)

      // --- Execute ---
      const responses = await testDestination.executeBatch('sync', {
        events,
        settings,
        auth,
        mapping: engageMapping
      })

      // --- Expected Segment MultiStatus Response ---
      expect(responses.length).toBe(4)

      // Add responses (index 0, 1)
      expect(responses[0]).toMatchObject({
        status: 200,
        body: {
          externalId: 'add-1',
          email: 'add1@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          enable_batching: true,
          batch_size: 10000,
          engage_fields: {
            traits_or_properties: { email: 'add1@test.com', [AUDIENCE_KEY]: true },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'POST',
          data: ['add-1', 'effe3148356c0668f1f2c19e9be26544dd7882baf23c863bdceabf5dc30ab769', ...EMPTY_TAIL]
        }
      })

      expect(responses[1]).toMatchObject({
        status: 200,
        body: {
          externalId: 'add-2',
          email: 'add2@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          enable_batching: true,
          batch_size: 10000,
          engage_fields: {
            traits_or_properties: { email: 'add2@test.com', [AUDIENCE_KEY]: true },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'POST',
          data: ['add-2', '4e695ab9c3779ecd2e487ba8707aec6371ff8953513bca0a6da8d4ade768f62d', ...EMPTY_TAIL]
        }
      })

      // Remove responses (index 2, 3)
      expect(responses[2]).toMatchObject({
        status: 200,
        body: {
          externalId: 'rm-1',
          email: 'remove1@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          enable_batching: true,
          batch_size: 10000,
          engage_fields: {
            traits_or_properties: { email: 'remove1@test.com', [AUDIENCE_KEY]: false },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'DELETE',
          data: ['rm-1', '839277c6f396d28d375f8a65ae5d9f0d5e54925d7503767c9d7e0f239bfce56b', ...EMPTY_TAIL]
        }
      })

      expect(responses[3]).toMatchObject({
        status: 200,
        body: {
          externalId: 'rm-2',
          email: 'remove2@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          enable_batching: true,
          batch_size: 10000,
          engage_fields: {
            traits_or_properties: { email: 'remove2@test.com', [AUDIENCE_KEY]: false },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'DELETE',
          data: ['rm-2', '8b0a92ab0ddc9e3f90d866912c856eec340390f665e029506ab740ef95c2c75a', ...EMPTY_TAIL]
        }
      })
    })

    it('should handle mixed results when adds succeed but removes fail', async () => {
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

      // --- Facebook Responses: POST succeeds, DELETE fails ---
      const facebookAddResponse = {
        audience_id: ENGAGE_AUDIENCE_ID,
        session_id: '111111',
        num_received: 2,
        num_invalid_entries: 0,
        invalid_entry_samples: {}
      }

      const facebookDeleteErrorResponse = {
        error: {
          message: 'Invalid parameter',
          type: 'OAuthException',
          code: 100,
          error_subcode: 1713231,
          error_user_title: 'Update Restricted Fields and Rule',
          error_user_msg: 'This custom audience has integrity restrictions.'
        }
      }

      nock(`${BASE_URL}/${API_VERSION}`)
        .post(`/${ENGAGE_AUDIENCE_ID}/users`, expectedAddBody)
        .reply(200, facebookAddResponse)

      nock(`${BASE_URL}/${API_VERSION}`)
        .delete(`/${ENGAGE_AUDIENCE_ID}/users`, expectedDeleteBody)
        .reply(400, facebookDeleteErrorResponse)

      // --- Execute ---
      const responses = await testDestination.executeBatch('sync', {
        events,
        settings,
        auth,
        mapping: engageMapping
      })

      // --- Expected Segment MultiStatus Response ---
      expect(responses.length).toBe(4)

      // Adds succeeded (index 0, 1)
      expect(responses[0]).toMatchObject({
        status: 200,
        body: {
          externalId: 'add-1',
          email: 'add1@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          engage_fields: {
            traits_or_properties: { email: 'add1@test.com', [AUDIENCE_KEY]: true },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'POST',
          data: ['add-1', 'effe3148356c0668f1f2c19e9be26544dd7882baf23c863bdceabf5dc30ab769', ...EMPTY_TAIL]
        }
      })

      expect(responses[1]).toMatchObject({
        status: 200,
        body: {
          externalId: 'add-2',
          email: 'add2@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          engage_fields: {
            traits_or_properties: { email: 'add2@test.com', [AUDIENCE_KEY]: true },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'POST',
          data: ['add-2', '4e695ab9c3779ecd2e487ba8707aec6371ff8953513bca0a6da8d4ade768f62d', ...EMPTY_TAIL]
        }
      })

      // Removes failed (index 2, 3)
      const expectedDeleteError = {
        status: 400,
        errortype: 'OAuthException',
        errormessage: 'Update Restricted Fields and Rule: This custom audience has integrity restrictions.'
      }

      expect(responses[2]).toMatchObject({
        ...expectedDeleteError,
        body: {
          externalId: 'rm-1',
          email: 'remove1@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          engage_fields: {
            traits_or_properties: { email: 'remove1@test.com', [AUDIENCE_KEY]: false },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'DELETE',
          data: ['rm-1', '839277c6f396d28d375f8a65ae5d9f0d5e54925d7503767c9d7e0f239bfce56b', ...EMPTY_TAIL]
        }
      })

      expect(responses[3]).toMatchObject({
        ...expectedDeleteError,
        body: {
          externalId: 'rm-2',
          email: 'remove2@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          engage_fields: {
            traits_or_properties: { email: 'remove2@test.com', [AUDIENCE_KEY]: false },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'DELETE',
          data: ['rm-2', '8b0a92ab0ddc9e3f90d866912c856eec340390f665e029506ab740ef95c2c75a', ...EMPTY_TAIL]
        }
      })
    })

    it('should handle mixed results when adds fail but removes succeed', async () => {
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

      // --- Facebook Responses: POST fails, DELETE succeeds ---
      const facebookAddErrorResponse = {
        error: {
          message: 'Failed to update the custom audience',
          type: 'OAuthException',
          code: 2650,
          fbtrace_id: 'XyzAbCdEfGh'
        }
      }

      const facebookDeleteResponse = {
        audience_id: ENGAGE_AUDIENCE_ID,
        session_id: '222222',
        num_received: 2,
        num_invalid_entries: 0,
        invalid_entry_samples: {}
      }

      nock(`${BASE_URL}/${API_VERSION}`)
        .post(`/${ENGAGE_AUDIENCE_ID}/users`, expectedAddBody)
        .reply(400, facebookAddErrorResponse)

      nock(`${BASE_URL}/${API_VERSION}`)
        .delete(`/${ENGAGE_AUDIENCE_ID}/users`, expectedDeleteBody)
        .reply(200, facebookDeleteResponse)

      // --- Execute ---
      const responses = await testDestination.executeBatch('sync', {
        events,
        settings,
        auth,
        mapping: engageMapping
      })

      // --- Expected Segment MultiStatus Response ---
      expect(responses.length).toBe(4)

      // Adds failed (index 0, 1)
      const expectedAddError = {
        status: 400,
        errortype: 'OAuthException',
        errormessage: 'Failed to update the custom audience',
        errorreporter: 'DESTINATION'
      }

      expect(responses[0]).toMatchObject({
        ...expectedAddError,
        body: {
          externalId: 'add-1',
          email: 'add1@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          engage_fields: {
            traits_or_properties: { email: 'add1@test.com', [AUDIENCE_KEY]: true },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'POST',
          data: ['add-1', 'effe3148356c0668f1f2c19e9be26544dd7882baf23c863bdceabf5dc30ab769', ...EMPTY_TAIL]
        }
      })

      expect(responses[1]).toMatchObject({
        ...expectedAddError,
        body: {
          externalId: 'add-2',
          email: 'add2@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          engage_fields: {
            traits_or_properties: { email: 'add2@test.com', [AUDIENCE_KEY]: true },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'POST',
          data: ['add-2', '4e695ab9c3779ecd2e487ba8707aec6371ff8953513bca0a6da8d4ade768f62d', ...EMPTY_TAIL]
        }
      })

      // Removes succeeded (index 2, 3)
      expect(responses[2]).toMatchObject({
        status: 200,
        body: {
          externalId: 'rm-1',
          email: 'remove1@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          engage_fields: {
            traits_or_properties: { email: 'remove1@test.com', [AUDIENCE_KEY]: false },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'DELETE',
          data: ['rm-1', '839277c6f396d28d375f8a65ae5d9f0d5e54925d7503767c9d7e0f239bfce56b', ...EMPTY_TAIL]
        }
      })

      expect(responses[3]).toMatchObject({
        status: 200,
        body: {
          externalId: 'rm-2',
          email: 'remove2@test.com',
          external_audience_id: ENGAGE_AUDIENCE_ID,
          engage_fields: {
            traits_or_properties: { email: 'remove2@test.com', [AUDIENCE_KEY]: false },
            audience_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: ENGAGE_AUDIENCE_ID,
          method: 'DELETE',
          data: ['rm-2', '8b0a92ab0ddc9e3f90d866912c856eec340390f665e029506ab740ef95c2c75a', ...EMPTY_TAIL]
        }
      })
    })

    it('should return validation error when payload is not from Engage', async () => {
      // --- Segment Events (track events without Engage context) ---
      const events = [
        createTestEvent({ userId: 'user-1', properties: { email: 'user1@example.com' } }),
        createTestEvent({ userId: 'user-2', properties: { email: 'user2@example.com' } })
      ]

      // --- Mapping (mirror mode but RETL-style payload) ---
      const mapping = {
        __segment_internal_sync_mode: 'mirror',
        externalId: { '@path': '$.userId' },
        email: { '@path': '$.properties.email' },
        external_audience_id: '5678',
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
        errormessage: 'Sync Mode set to "Mirror", but payload is not from Engage. Please ensure payloads are sent from Engage when using "Mirror" sync mode.'
      })

      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Sync Mode set to "Mirror", but payload is not from Engage. Please ensure payloads are sent from Engage when using "Mirror" sync mode.'
      })
    })

    it('should return validation error when audience ID is missing', async () => {
      // --- Segment Events (Engage-style but no audience ID) ---
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'add-1',
          traits: { email: 'add1@test.com', [AUDIENCE_KEY]: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: AUDIENCE_KEY
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'add-2',
          traits: { email: 'add2@test.com', [AUDIENCE_KEY]: true },
          context: {
            personas: {
              computation_class: 'audience',
              computation_key: AUDIENCE_KEY
            }
          }
        })
      ]

      // --- Mapping (no external_audience_id, empty hook outputs) ---
      const mapping = {
        __segment_internal_sync_mode: 'mirror',
        externalId: { '@path': '$.userId' },
        email: { '@path': '$.traits.email' },
        external_audience_id: { '@path': '$.context.personas.external_audience_id' },
        engage_fields: {
          traits_or_properties: {
            '@if': {
              exists: { '@path': '$.traits' },
              then: { '@path': '$.traits' },
              else: { '@path': '$.properties' }
            }
          },
          audience_key: { '@path': '$.context.personas.computation_key' },
          computation_class: { '@path': '$.context.personas.computation_class' }
        },
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
        errormessage: 'Missing audience ID.'
      })

      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Missing audience ID.'
      })
    })
  })
})
