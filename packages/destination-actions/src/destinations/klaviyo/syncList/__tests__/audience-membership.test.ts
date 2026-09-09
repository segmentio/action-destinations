import nock from 'nock'
import { createTestEvent, createTestIntegration, FLAGS } from '@segment/actions-core'
import Destination from '../../index'
import { API_URL } from '../../config'

const testDestination = createTestIntegration(Destination)

const settings = { api_key: 'fake-api-key' }
const listId = 'XYZABC'

const LEGACY_JOURNEYS_FLAG = { [FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP]: true }

// A legacy Journeys (V1) event: journey_step computation_class, but no boolean at
// properties[computation_key] - V1 payloads never carry one.
function legacyJourneysEvent(email: string) {
  return createTestEvent({
    type: 'track',
    properties: { email },
    context: {
      personas: {
        computation_class: 'journey_step',
        computation_key: 'my_journey'
      }
    }
  })
}

describe('Klaviyo.syncList - legacy JourneysV1 audience membership', () => {
  beforeEach(() => nock.cleanAll())

  it('always adds the user when the legacy journeys flag is enabled and no membership boolean is present', async () => {
    const email = 'legacy-user@example.com'
    nock(API_URL)
      .post('/profiles/', { data: { type: 'profile', attributes: { email } } })
      .reply(200, { data: { id: 'PROFILE1' } })

    nock(`${API_URL}/lists/${listId}`)
      .post('/relationships/profiles/', { data: [{ type: 'profile', id: 'PROFILE1' }] })
      .reply(200, {})

    const r = await testDestination.testAction('syncList', {
      event: legacyJourneysEvent(email),
      settings,
      mapping: { list_id: listId, email },
      features: LEGACY_JOURNEYS_FLAG
    })

    expect(r[0].status).toBe(200)
  })

  it('throws instead of defaulting to add when the same event arrives without the legacy journeys flag', async () => {
    // Proves the "always add" behavior above is genuinely gated by the flag, not just an
    // incidental effect of the journey_step event shape.
    const email = 'legacy-user@example.com'

    await expect(
      testDestination.testAction('syncList', {
        event: legacyJourneysEvent(email),
        settings,
        mapping: { list_id: listId, email }
      })
    ).rejects.toThrow('Audience Membership must be a boolean')
  })
})
