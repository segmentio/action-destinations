import nock from 'nock'
import { createTestEvent, createTestIntegration, FLAGS } from '@segment/actions-core'
import Destination from '../../index'
import { BULK_IMPORT_ENDPOINT } from '../../constants'

const testDestination = createTestIntegration(Destination)

const LIST_ID = '12345'
const API_ENDPOINT = 'https://123-ABC-456.mktorest.com'
const settings = {
  client_id: '1234',
  client_secret: '1234',
  api_endpoint: API_ENDPOINT,
  folder_name: 'Test Folder'
}

const mapping = {
  external_id: { '@path': '$.context.personas.external_audience_id' },
  lookup_field: 'email',
  data: {
    email: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    }
  },
  field_value: {
    '@if': {
      exists: { '@path': '$.context.traits.email' },
      then: { '@path': '$.context.traits.email' },
      else: { '@path': '$.properties.email' }
    }
  },
  enable_batching: true,
  batch_size: 300,
  event_name: { '@path': '$.event' }
}

// This resolution itself lives in actions-core (packages/core/src/audience-membership.ts,
// legacyJourneysAudienceMembership - journey_step + no boolean at properties[computation_key] =>
// always an add), gated behind FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP. These tests
// re-verify that resolution's effect at the destination level: syncList must actually route a
// legacy Journeys (V1) event to addToList, not just receive `true` from core in isolation.
const LEGACY_JOURNEYS_FLAG = { [FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP]: true }

// Legacy Journeys V1 event: journey_step computation_class, but no boolean at
// properties[computation_key] - V1 payloads never carry one.
function legacyJourneysEvent(email: string) {
  return createTestEvent({
    event: 'Journeys Step Entered',
    type: 'track',
    properties: { email },
    context: {
      traits: { email },
      personas: {
        computation_class: 'journey_step',
        computation_key: 'my_journey',
        external_audience_id: LIST_ID
      }
    }
  })
}

describe('MarketoStaticLists.syncList - legacy JourneysV1 audience membership', () => {
  beforeEach(() => nock.cleanAll())

  it('always adds the user when the legacy journeys flag is enabled and no membership boolean is present', async () => {
    const scope = nock(API_ENDPOINT)
      .post(BULK_IMPORT_ENDPOINT.replace('externalId', LIST_ID).replace('fieldToLookup', 'email'))
      .reply(200, { success: true })

    const r = await testDestination.testAction('syncList', {
      event: legacyJourneysEvent('legacy-user@example.com'),
      settings,
      mapping,
      features: LEGACY_JOURNEYS_FLAG
    })

    expect(r[0].status).toEqual(200)
    expect(scope.isDone()).toBe(true)
  })

  it('throws instead of defaulting to add when the same event arrives without the legacy journeys flag', async () => {
    // Proves the "always add" behavior above is genuinely gated by the flag, not just an
    // incidental effect of the journey_step event shape.
    await expect(
      testDestination.testAction('syncList', {
        event: legacyJourneysEvent('legacy-user@example.com'),
        settings,
        mapping
      })
    ).rejects.toThrow('Audience Membership must be a boolean')
  })
})
