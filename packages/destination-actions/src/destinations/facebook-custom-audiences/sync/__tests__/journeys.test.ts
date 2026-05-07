import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { getJourneysMemberships } from '../functions'
import { RawData } from '../types'
import { BASE_URL, FACEBOOK_CUSTOM_AUDIENCE_JOURNEYS_FLAGON } from '../../constants'

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
// getJourneysMemberships (unit tests)
// ---------------------------------------------------------------------------
describe('getJourneysMemberships', () => {
  it('returns undefined when rawDatas is undefined', () => {
    expect(getJourneysMemberships(undefined)).toBeUndefined()
  })

  it('returns undefined when rawDatas is an empty array', () => {
    expect(getJourneysMemberships([])).toBeUndefined()
  })

  it('returns undefined when no events are journey_step', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'audience' } } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    expect(getJourneysMemberships(rawDatas)).toBeUndefined()
  })

  it('returns an array of true values when all events are journey_step', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: {} },
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: {} },
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: {} }
    ]
    const result = getJourneysMemberships(rawDatas)
    expect(result).toEqual([true, true, true])
    expect(result).toHaveLength(3)
  })

  it('throws PayloadValidationError when batch contains a mix of journey_step and non-journey_step', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: {} },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    expect(() => getJourneysMemberships(rawDatas)).toThrow(
      'Batch contains a mix of journey_step and non-journey_step events. All events in a batch must be the same computation_class.'
    )
  })

  it('returns array matching rawDatas length for single event', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'journey_step', computation_key: 'my_audience' } }, properties: {} }
    ]
    const result = getJourneysMemberships(rawDatas)
    expect(result).toEqual([true])
  })
})

// ---------------------------------------------------------------------------
// Feature flag gating (integration tests)
// ---------------------------------------------------------------------------
describe('FacebookCustomAudiences.sync - journey_step with feature flag', () => {
  beforeEach(() => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
  })

  it('should add all journey_step users when feature flag is enabled', async () => {
    const events = [
      makeJourneyEvent('user1@test.com', 'user-1'),
      makeJourneyEvent('user2@test.com', 'user-2')
    ]

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
      auth,
      features: { [FACEBOOK_CUSTOM_AUDIENCE_JOURNEYS_FLAGON]: true }
    })

    expect(responses).toBeDefined()
    const successResponses = responses.filter((r: any) => r.status === 200)
    expect(successResponses).toHaveLength(2)
  })

  it('should fail with missing membership details when feature flag is disabled', async () => {
    const events = [
      makeJourneyEvent('user1@test.com', 'user-1'),
      makeJourneyEvent('user2@test.com', 'user-2')
    ]

    const responses = await testDestination.executeBatch('sync', {
      events,
      settings,
      mapping: journeyMapping,
      auth,
      features: {}
    })

    expect(responses).toBeDefined()
    const errorResponses = responses.filter((r: any) => r.status >= 400)
    expect(errorResponses).toHaveLength(2)
    expect(errorResponses[0].errormessage).toBe('Audience membership details missing')
    expect(errorResponses[1].errormessage).toBe('Audience membership details missing')
  })
})
