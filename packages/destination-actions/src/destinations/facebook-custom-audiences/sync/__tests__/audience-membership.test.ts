import nock from 'nock'
import { createTestEvent, createTestIntegration, FLAGS } from '@segment/actions-core'
import Destination from '../../index'
import { API_VERSION, BASE_URL } from '../../constants'
import { SCHEMA_PROPERTIES } from '../constants'
import { processHashing } from '../../../../lib/hashing-utils'

let testDestination = createTestIntegration(Destination)

const auth = {
  accessToken: '123',
  refreshToken: '321'
}

const settings = {
  retlAdAccountId: '123'
}

const AUDIENCE_ID = '9436930380'
const COMPUTATION_KEY = 'testaudiencename'

// Feature flag that enables Legacy Journeys membership resolution
// (journey_step events with no membership boolean => always added).
const LEGACY_JOURNEYS_FLAG = { [FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP]: true }

// 13 empty strings for the unmapped PII schema slots that follow EXTERN_ID and EMAIL:
// PHONE, DOBY, DOBM, DOBD, LN, FN, FI, GEN, CT, ST, ZIP, COUNTRY, MADID
const EMPTY_TAIL = ['', '', '', '', '', '', '', '', '', '', '', '', '']

const hashEmail = (email: string) => processHashing(email.trim().toLowerCase(), 'sha256', 'hex')

// Mapping exactly as configured for the JourneysV2 / Engage / RETL event format.
// Note: there is no `membership_fields` block — membership is resolved centrally by the
// framework from context.personas (computation_class/computation_key) + properties[computation_key].
const mapping = {
  __segment_internal_sync_mode: 'mirror',
  externalId: { '@path': '$.userId' },
  email: { '@path': '$.properties.email' },
  external_audience_id: { '@path': '$.context.personas.external_audience_id' },
  enable_batching: true,
  batch_size: 10000
}

// JourneysV2 / Engage / RETL event: carries the membership boolean at
// properties[computation_key]. `true` => add, `false` => remove.
// computation_class may be 'journey_step' (JourneysV2) or 'audience' (Engage/RETL);
// both resolve membership identically via properties[computation_key].
function makeEvent(
  userId: string,
  email: string,
  membership: boolean,
  computationClass: 'journey_step' | 'audience' = 'audience'
) {
  return createTestEvent({
    type: 'track',
    event: 'This Is A Test Event',
    userId,
    properties: {
      [COMPUTATION_KEY]: membership,
      email
    },
    context: {
      personas: {
        audience_settings: { external_id_type: 'CRM_ID' },
        computation_class: computationClass,
        computation_id: 'p_0_destina__Google_ads__rhwsm',
        computation_key: COMPUTATION_KEY,
        external_audience_id: AUDIENCE_ID
      }
    }
  })
}

// Legacy Journeys event: same shape but WITHOUT the membership boolean at
// properties[computation_key]. These users are always added to the audience.
function makeLegacyEvent(userId: string, email: string) {
  return createTestEvent({
    type: 'track',
    event: 'This Is A Test Event',
    userId,
    properties: {
      email
    },
    context: {
      personas: {
        audience_settings: { external_id_type: 'CRM_ID' },
        computation_class: 'journey_step',
        computation_id: 'p_0_destina__Google_ads__rhwsm',
        computation_key: COMPUTATION_KEY,
        external_audience_id: AUDIENCE_ID
      }
    }
  })
}

describe('FacebookCustomAudiences.sync - audience membership resolution', () => {
  beforeEach(() => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
  })

  describe('JourneysV2 / Engage / RETL format (membership boolean present)', () => {
    it('JourneysV2: adds users when properties[computation_key] is true and removes them when false', async () => {
      const events = [
        makeEvent('user1', 'user1@example.com', true, 'journey_step'),
        makeEvent('user2', 'user2@example.com', true, 'journey_step'),
        makeEvent('user3', 'user3@example.com', false, 'journey_step'),
        makeEvent('user4', 'user4@example.com', false, 'journey_step')
      ]

      // Adds (membership === true) are sent as a POST.
      const expectedAddBody = {
        payload: {
          schema: SCHEMA_PROPERTIES,
          data: [
            ['user1', hashEmail('user1@example.com'), ...EMPTY_TAIL],
            ['user2', hashEmail('user2@example.com'), ...EMPTY_TAIL]
          ]
        }
      }

      // Removes (membership === false) are sent as a DELETE.
      const expectedDeleteBody = {
        payload: {
          schema: SCHEMA_PROPERTIES,
          data: [
            ['user3', hashEmail('user3@example.com'), ...EMPTY_TAIL],
            ['user4', hashEmail('user4@example.com'), ...EMPTY_TAIL]
          ]
        }
      }

      const addScope = nock(`${BASE_URL}/${API_VERSION}`)
        .post(`/${AUDIENCE_ID}/users`, expectedAddBody)
        .reply(200, { num_received: 2, num_invalid_entries: 0 })

      const deleteScope = nock(`${BASE_URL}/${API_VERSION}`)
        .delete(`/${AUDIENCE_ID}/users`, expectedDeleteBody)
        .reply(200, { num_received: 2, num_invalid_entries: 0 })

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings,
        auth,
        mapping
      })

      expect(responses.length).toBe(4)

      // Adds (indexes 0, 1) => POST
      expect(responses[0]).toMatchObject({
        status: 200,
        body: { externalId: 'user1', external_audience_id: AUDIENCE_ID },
        sent: { method: 'POST', audienceId: AUDIENCE_ID }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        body: { externalId: 'user2', external_audience_id: AUDIENCE_ID },
        sent: { method: 'POST', audienceId: AUDIENCE_ID }
      })

      // Removes (indexes 2, 3) => DELETE
      expect(responses[2]).toMatchObject({
        status: 200,
        body: { externalId: 'user3', external_audience_id: AUDIENCE_ID },
        sent: { method: 'DELETE', audienceId: AUDIENCE_ID }
      })
      expect(responses[3]).toMatchObject({
        status: 200,
        body: { externalId: 'user4', external_audience_id: AUDIENCE_ID },
        sent: { method: 'DELETE', audienceId: AUDIENCE_ID }
      })

      expect(addScope.isDone()).toBe(true)
      expect(deleteScope.isDone()).toBe(true)
    })

    it('Engage/RETL: adds users when properties[computation_key] is true and removes them when false', async () => {
      const events = [
        makeEvent('user1', 'user1@example.com', true, 'audience'),
        makeEvent('user2', 'user2@example.com', true, 'audience'),
        makeEvent('user3', 'user3@example.com', false, 'audience'),
        makeEvent('user4', 'user4@example.com', false, 'audience')
      ]

      // Adds (membership === true) are sent as a POST.
      const expectedAddBody = {
        payload: {
          schema: SCHEMA_PROPERTIES,
          data: [
            ['user1', hashEmail('user1@example.com'), ...EMPTY_TAIL],
            ['user2', hashEmail('user2@example.com'), ...EMPTY_TAIL]
          ]
        }
      }

      // Removes (membership === false) are sent as a DELETE.
      const expectedDeleteBody = {
        payload: {
          schema: SCHEMA_PROPERTIES,
          data: [
            ['user3', hashEmail('user3@example.com'), ...EMPTY_TAIL],
            ['user4', hashEmail('user4@example.com'), ...EMPTY_TAIL]
          ]
        }
      }

      const addScope = nock(`${BASE_URL}/${API_VERSION}`)
        .post(`/${AUDIENCE_ID}/users`, expectedAddBody)
        .reply(200, { num_received: 2, num_invalid_entries: 0 })

      const deleteScope = nock(`${BASE_URL}/${API_VERSION}`)
        .delete(`/${AUDIENCE_ID}/users`, expectedDeleteBody)
        .reply(200, { num_received: 2, num_invalid_entries: 0 })

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings,
        auth,
        mapping
      })

      expect(responses.length).toBe(4)

      // Adds (indexes 0, 1) => POST
      expect(responses[0]).toMatchObject({
        status: 200,
        body: { externalId: 'user1', external_audience_id: AUDIENCE_ID },
        sent: { method: 'POST', audienceId: AUDIENCE_ID }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        body: { externalId: 'user2', external_audience_id: AUDIENCE_ID },
        sent: { method: 'POST', audienceId: AUDIENCE_ID }
      })

      // Removes (indexes 2, 3) => DELETE
      expect(responses[2]).toMatchObject({
        status: 200,
        body: { externalId: 'user3', external_audience_id: AUDIENCE_ID },
        sent: { method: 'DELETE', audienceId: AUDIENCE_ID }
      })
      expect(responses[3]).toMatchObject({
        status: 200,
        body: { externalId: 'user4', external_audience_id: AUDIENCE_ID },
        sent: { method: 'DELETE', audienceId: AUDIENCE_ID }
      })

      expect(addScope.isDone()).toBe(true)
      expect(deleteScope.isDone()).toBe(true)
    })
  })

  describe('Legacy Journeys format (no membership boolean)', () => {
    it('Legacy Journeys: always adds users when the membership boolean is absent', async () => {
      const events = [
        makeLegacyEvent('legacy-user1', 'legacy1@example.com'),
        makeLegacyEvent('legacy-user2', 'legacy2@example.com')
      ]

      // No membership boolean => Legacy Journeys => all users added via POST.
      const expectedAddBody = {
        payload: {
          schema: SCHEMA_PROPERTIES,
          data: [
            ['legacy-user1', hashEmail('legacy1@example.com'), ...EMPTY_TAIL],
            ['legacy-user2', hashEmail('legacy2@example.com'), ...EMPTY_TAIL]
          ]
        }
      }

      const addScope = nock(`${BASE_URL}/${API_VERSION}`)
        .post(`/${AUDIENCE_ID}/users`, expectedAddBody)
        .reply(200, { num_received: 2, num_invalid_entries: 0 })

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings,
        auth,
        mapping,
        features: LEGACY_JOURNEYS_FLAG
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        body: { externalId: 'legacy-user1', external_audience_id: AUDIENCE_ID },
        sent: { method: 'POST', audienceId: AUDIENCE_ID }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        body: { externalId: 'legacy-user2', external_audience_id: AUDIENCE_ID },
        sent: { method: 'POST', audienceId: AUDIENCE_ID }
      })

      expect(addScope.isDone()).toBe(true)
    })
  })
})
