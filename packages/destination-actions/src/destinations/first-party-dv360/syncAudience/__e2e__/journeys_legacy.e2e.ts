import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EJourneysV1AudienceEvent, FLAGS } from '@segment/actions-core'
import syncAudience from '../index'

const COMPUTATION_KEY = 'e2e_test_dv360_journeys_legacy'
const COMPUTATION_ID = 'aud_e2e_dv360_journeys_legacy_001'

const FAILURE_HINT =
  'Needs E2E_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,ADVERTISER_ID,APP_ID} and ' +
  'ACTIONS_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET}. The refresh token must carry the display-video ' +
  'scope and reach the advertiser: the copy in the secret store has expired, so read a live one from ' +
  'the oauth row of a staging destination instance.'

const mapping = defaultValues(syncAudience.fields)

const ADVERTISER_ID = process.env.E2E_FIRST_PARTY_DV360_ADVERTISER_ID ?? ''

const AUDIENCE = { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }

// What is reported against an event is the request as it would have been had it carried that event
// alone. Consent has no default, and an unmapped consent leaves the key off altogether.
const added = (member: unknown) => ({ advertiserId: ADVERTISER_ID, addedContactInfoList: { contactInfos: [member] } })

// Legacy Journeys events carry no membership boolean at all: there is no properties[computation_key]
// to read. With the flag on, core resolves them to an add, which is the only outcome these events
// can have. With the flag off membership cannot be resolved and the event fails before any request
// is made, which is covered by the unit tests rather than here.
const fixtures: E2EFixture[] = [
  {
    // Batched rather than single so that what was sent can be asserted: only a multi-status carries
    // it, and it is the only thing which tells an add from a remove. A single event reports the
    // response alone, which names the audience and nothing else.
    description: 'Journeys legacy: an event with no membership boolean is added',
    subscribe: 'type = "track"',
    mapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    features: { [FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP]: true },
    events: [
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-legacy-1',
        email: 'e2e-dv360-legacy@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: added({ hashedEmails: ['5cb67c52da4f9ce8565e8fc9e0704d5ba5cc0f8c365dcae7f146b7ebdde67b21'] }),
          body: AUDIENCE
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
