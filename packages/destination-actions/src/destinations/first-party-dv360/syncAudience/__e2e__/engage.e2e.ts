import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'
import { CONTACT_INFO } from '../constants'

const COMPUTATION_KEY = 'e2e_test_dv360_engage'
const COMPUTATION_ID = 'aud_e2e_dv360_engage_001'

const FAILURE_HINT =
  'Needs E2E_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,ADVERTISER_ID,APP_ID} and ' +
  'ACTIONS_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET}. The refresh token must carry the display-video ' +
  'scope and reach the advertiser: the copy in the secret store has expired, so read a live one from ' +
  'the oauth row of a staging destination instance.'

const mapping = { ...defaultValues(syncAudience.fields), audience_type: CONTACT_INFO }

// Display & Video 360 answers with nothing but the id of the audience it wrote to, so this says the
// request was accepted and reached the right audience. It says nothing about whether the members
// matched anyone: the API reports that nowhere.
const ACCEPTED = {
  status: 'success',
  httpStatus: 200,
  jsonContains: { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }
} as const

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

// Engage carries the membership boolean at properties[computation_key], which is what decides an
// add from a remove. Whether the identifiers themselves are valid is settled locally and covered by
// the unit tests; these prove Display & Video 360 accepts what the action builds.
const fixtures: E2EFixture[] = [
  {
    description: 'Engage: add a user',
    subscribe: 'type = "track"',
    mapping,
    mode: 'single',
    audience: 'contactInfo',
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'add',
      eventName: 'Audience Entered',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId:contactInfo',
      userId: 'e2e-dv360-engage-add',
      email: 'e2e-dv360-engage-add@segment.com'
    }),
    expect: ACCEPTED,
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Engage: remove a user',
    subscribe: 'type = "track"',
    mapping,
    mode: 'single',
    audience: 'contactInfo',
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'remove',
      eventName: 'Audience Exited',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId:contactInfo',
      userId: 'e2e-dv360-engage-remove',
      email: 'e2e-dv360-engage-remove@segment.com'
    }),
    expect: ACCEPTED,
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Display & Video 360 rejects a request carrying both an added and a removed list. The
    // action splits them into one request per direction, and each event reports its own outcome.
    description: 'Engage: a batch mixing an add and a remove is split into two requests',
    subscribe: 'type = "track"',
    mapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-mixed-add',
        email: 'e2e-dv360-mixed-add@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'remove',
        eventName: 'Audience Exited',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-mixed-remove',
        email: 'e2e-dv360-mixed-remove@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: added({ hashedEmails: ['8b8870e006c914e930a96269ba26d8632691d1375f66260c4a72fd4db9f46527'] }),
          body: AUDIENCE
        },
        {
          status: 200,
          sent: removed({ hashedEmails: ['fed4c757608b4c16251f3f8a697ba5800b6b3981c3464d3668d056f4df43d406'] }),
          body: AUDIENCE
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
