import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EJourneysV2AudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'
import { CONTACT_INFO } from '../constants'

const COMPUTATION_KEY = 'e2e_test_dv360_journeys_v2'
const COMPUTATION_ID = 'aud_e2e_dv360_journeys_v2_001'

const FAILURE_HINT =
  'Needs E2E_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,ADVERTISER_ID,APP_ID} and ' +
  'ACTIONS_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET}. The refresh token must carry the display-video ' +
  'scope and reach the advertiser: the copy in the secret store has expired, so read a live one from ' +
  'the oauth row of a staging destination instance.'

const mapping = { ...defaultValues(syncAudience.fields), audience_type: CONTACT_INFO }

const AUDIENCE = { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }

const ADVERTISER_ID = process.env.E2E_FIRST_PARTY_DV360_ADVERTISER_ID ?? ''

// What is reported against an event is the request as it would have been had it carried that event
// alone, so the list it travelled in is visible per index. Consent has no default, and an unmapped
// consent leaves the key off altogether.
const added = (member: unknown) => ({ advertiserId: ADVERTISER_ID, addedContactInfoList: { contactInfos: [member] } })
const removed = (member: unknown) => ({
  advertiserId: ADVERTISER_ID,
  removedContactInfoList: { contactInfos: [member] }
})

// Journeys V2 events use computation_class 'journey_step' but still carry the membership boolean at
// properties[computation_key], so add and remove are resolved from the boolean exactly as for
// Engage. No feature flag is involved: the legacy flag only decides what happens when the value is
// missing, which is journeys_legacy.
const fixtures: E2EFixture[] = [
  {
    description: 'Journeys V2: a batch of entering users is added',
    subscribe: 'type = "track"',
    mapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      createE2EJourneysV2AudienceEvent({
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-jv2-add-1',
        email: 'e2e-dv360-jv2-add@segment.com'
      }),
      createE2EJourneysV2AudienceEvent({
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-jv2-add-2',
        email: 'e2e-dv360-jv2-remove@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: added({ hashedEmails: ['320a079f6cb849b81ddaf46cce6cb632a1cc56339af53f26f21d39ddad21e16a'] }),
          body: AUDIENCE
        },
        {
          status: 200,
          sent: added({ hashedEmails: ['0681702aaed006e17f45a6e98cd429efba57465c031e3821a77b3d7aad62e427'] }),
          body: AUDIENCE
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Journeys V2: a batch of exiting users is removed',
    subscribe: 'type = "track"',
    mapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      createE2EJourneysV2AudienceEvent({
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-jv2-add-1',
        email: 'e2e-dv360-jv2-add@segment.com'
      }),
      createE2EJourneysV2AudienceEvent({
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-jv2-add-2',
        email: 'e2e-dv360-jv2-remove@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: removed({ hashedEmails: ['320a079f6cb849b81ddaf46cce6cb632a1cc56339af53f26f21d39ddad21e16a'] }),
          body: AUDIENCE
        },
        {
          status: 200,
          sent: removed({ hashedEmails: ['0681702aaed006e17f45a6e98cd429efba57465c031e3821a77b3d7aad62e427'] }),
          body: AUDIENCE
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
