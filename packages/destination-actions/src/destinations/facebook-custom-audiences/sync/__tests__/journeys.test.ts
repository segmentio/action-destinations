import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { getJourneysV1Memberships } from '../functions'
import { RawData } from '../types'
import { BASE_URL } from '../../constants'

let testDestination = createTestIntegration(Destination)

const auth = {
  accessToken: '123',
  refreshToken: '321'
}

const settings = {
  retlAdAccountId: '123'
}

const AUDIENCE_ID = '1234'
const AUDIENCE_KEY = 'journey_step_key'

const journeyMapping = {
  __segment_internal_sync_mode: 'mirror',
  externalId: { '@path': '$.userId' },
  email: { '@path': '$.properties.email' },
  external_audience_id: { '@path': '$.context.personas.external_audience_id' },
  retlOnMappingSave: {
    inputs: {},
    outputs: {}
  },
  enable_batching: true,
  batch_size: 10000
}

function makeJourneyEvent(email: string, userId: string) {
  return createTestEvent({
    type: 'track',
    event: 'Journey Step Entered',
    userId,
    properties: {
      email
    },
    context: {
      personas: {
        external_audience_id: AUDIENCE_ID,
        computation_class: 'journey_step',
        computation_key: AUDIENCE_KEY
      }
    }
  })
}

// ---------------------------------------------------------------------------
// getJourneysV1Memberships (unit tests)
// ---------------------------------------------------------------------------
describe('getJourneysV1Memberships', () => {
  it('returns undefined when rawDatas is undefined', () => {
    expect(getJourneysV1Memberships(undefined)).toBeUndefined()
  })

  it('returns undefined when rawDatas is an empty array', () => {
    expect(getJourneysV1Memberships([])).toBeUndefined()
  })

  it('returns undefined when no events are journey_step', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'audience' } } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    expect(getJourneysV1Memberships(rawDatas)).toBeUndefined()
  })

  it('returns an array of true values when all events are journey_step', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: {} },
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: {} },
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: {} }
    ]
    const result = getJourneysV1Memberships(rawDatas)
    expect(result).toEqual([true, true, true])
    expect(result).toHaveLength(3)
  })

  it('throws InvalidAudienceMembershipError when batch contains a mix of journey_step and non-journey_step', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: {} },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    expect(() => getJourneysV1Memberships(rawDatas)).toThrow(
      'Batch contains a mix of journey_step and non-journey_step events. All events in a batch must be the same computation_class.'
    )
  })

  it('returns array matching rawDatas length for single event', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: {} }
    ]
    const result = getJourneysV1Memberships(rawDatas)
    expect(result).toEqual([true])
  })

  it('returns all true even when properties[computation_key] is a boolean', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: { my_audience: true } },
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: { my_audience: false } },
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: { my_audience: true } }
    ]
    const result = getJourneysV1Memberships(rawDatas)
    expect(result).toEqual([true, true, true])
  })
})

// ---------------------------------------------------------------------------
// journey_step batch behavior (integration tests)
// ---------------------------------------------------------------------------
describe('FacebookCustomAudiences.sync - journey_step', () => {
  beforeEach(() => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
  })

  // JourneysV1: journey_step events without per-event membership booleans => all users added.
  it('JourneysV1: adds all journey_step users (no membership booleans)', async () => {
    const events = [makeJourneyEvent('user1@test.com', 'user-1'), makeJourneyEvent('user2@test.com', 'user-2')]

    nock(BASE_URL)
      .post(new RegExp(`/${AUDIENCE_ID}/users`))
      .reply(200, {
        audience_id: AUDIENCE_ID,
        session_id: '111',
        num_received: 2,
        num_invalid_entries: 0,
        invalid_entry_samples: {}
      })

    const responses = await testDestination.executeBatch('sync', {
      events,
      settings,
      mapping: journeyMapping,
      auth
    })

    expect(responses).toBeDefined()
    const successResponses = responses.filter((r: any) => r.status === 200)
    expect(successResponses).toHaveLength(2)
  })

  // JourneysV2: journey_step events that DO carry membership booleans => add and remove honored
  // (the journey membership override is skipped when audienceMemberships are already booleans).
  it('JourneysV2: honors per-event membership booleans (add + remove)', async () => {
    const events = [
      createTestEvent({
        type: 'track',
        event: 'Journey Step Entered',
        userId: 'user-1',
        properties: {
          email: 'user1@test.com',
          [AUDIENCE_KEY]: true
        },
        context: {
          personas: {
            external_audience_id: AUDIENCE_ID,
            computation_class: 'journey_step',
            computation_key: AUDIENCE_KEY
          }
        }
      }),
      createTestEvent({
        type: 'track',
        event: 'Journey Step Entered',
        userId: 'user-2',
        properties: {
          email: 'user2@test.com',
          [AUDIENCE_KEY]: false
        },
        context: {
          personas: {
            external_audience_id: AUDIENCE_ID,
            computation_class: 'journey_step',
            computation_key: AUDIENCE_KEY
          }
        }
      })
    ]

    const addNock = nock(BASE_URL)
      .post(new RegExp(`/${AUDIENCE_ID}/users`))
      .reply(200, {
        audience_id: AUDIENCE_ID,
        session_id: '111',
        num_received: 1,
        num_invalid_entries: 0,
        invalid_entry_samples: {}
      })

    const deleteNock = nock(BASE_URL)
      .delete(new RegExp(`/${AUDIENCE_ID}/users`))
      .reply(200, {
        audience_id: AUDIENCE_ID,
        session_id: '222',
        num_received: 1,
        num_invalid_entries: 0,
        invalid_entry_samples: {}
      })

    const responses = await testDestination.executeBatch('sync', {
      events,
      settings,
      mapping: journeyMapping,
      auth
    })

    expect(responses).toBeDefined()
    const successResponses = responses.filter((r: any) => r.status === 200)
    expect(successResponses).toHaveLength(2)
    expect(addNock.isDone()).toBe(true)
    expect(deleteNock.isDone()).toBe(true)
  })
})
