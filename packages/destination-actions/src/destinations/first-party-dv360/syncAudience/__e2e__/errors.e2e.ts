import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'
import { CONTACT_INFO } from '../constants'

const COMPUTATION_KEY = 'e2e_test_dv360_errors'
const COMPUTATION_ID = 'aud_e2e_dv360_errors_001'

const FAILURE_HINT =
  'Needs E2E_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,ADVERTISER_ID,APP_ID} and ' +
  'ACTIONS_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET}. The refresh token must carry the display-video ' +
  'scope and reach the advertiser: the copy in the secret store has expired, so read a live one from ' +
  'the oauth row of a staging destination instance.'

const ADVERTISER_ID = process.env.E2E_FIRST_PARTY_DV360_ADVERTISER_ID ?? ''

const mapping = defaultValues(syncAudience.fields)

// An audience id which is well formed but belongs to nobody, so the request is built and sent and
// only Display & Video 360 can reject it.
const UNOWNED_AUDIENCE_ID = '1234567890'

// Rejections which only Display & Video 360 can produce. Everything the action decides for itself,
// such as a missing audience ID, an unusable identifier or a denied consent, never reaches the API
// and is left to the unit tests.
//
// All of these come back as 400 INVALID_ARGUMENT, and the message names the offending id. The
// whole of it is asserted below: the message is the only part of a rejection which says what was
// actually wrong, and it is what a customer reads in the delivery record.
const NOT_OWNED = `Audience "${UNOWNED_AUDIENCE_ID}" is not owned by advertiser "${ADVERTISER_ID}".`
const BAD_ADVERTISER = 'The value "999999999" is not valid for field "advertiserId".'

const rejection = (message: string) => ({ error: { code: 400, message, status: 'INVALID_ARGUMENT' } })

const fixtures: E2EFixture[] = [
  {
    // A rejected event still reports what was attempted, so the request which failed can be read
    // back from the delivery record rather than guessed at.
    description: 'Error: an audience which the advertiser does not own is rejected by the API',
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
        externalAudienceId: UNOWNED_AUDIENCE_ID,
        userId: 'e2e-dv360-err-audience',
        email: 'e2e-dv360-err-audience@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errorreporter: 'DESTINATION',
          errormessage: NOT_OWNED,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: {
              contactInfos: [{ hashedEmails: ['470849999184887ea867b6e28040d7a885f08c9e417720140c36f2121c6c7a13'] }]
            }
          },
          body: rejection(NOT_OWNED)
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // The advertiser reaches the action through the mapping save hook here, so a warehouse mapping
    // pointing at an advertiser which does not exist fails the same way an audience setting would.
    description: 'Error: an advertiser which does not exist is rejected by the API',
    subscribe: 'type = "track"',
    mapping: {
      ...mapping,
      retlOnMappingSave: {
        outputs: {
          audienceId: '$externalAudienceId:contactInfo',
          advertiserId: '999999999',
          audienceType: CONTACT_INFO
        }
      }
    },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        userId: 'e2e-dv360-err-advertiser',
        email: 'e2e-dv360-err-advertiser@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errorreporter: 'DESTINATION',
          errormessage: BAD_ADVERTISER,
          sent: {
            // The advertiser which was really sent, from the hook output rather than the settings.
            advertiserId: '999999999',
            addedContactInfoList: {
              contactInfos: [{ hashedEmails: ['cf4dd5adf5b231021c5507c52ab32e5bfc75e3110305e6d04606b89cc7290abb'] }]
            }
          },
          body: rejection(BAD_ADVERTISER)
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // A single event has no multi-status to report into, so the same rejection has to be thrown
    // instead. The class is what decides whether the delivery layer retries the event or discards
    // it, and a 400 is not retried.
    //
    // Only the class, the status and the message survive being thrown: an IntegrationError carries
    // no response, so what was sent and what came back are not reported the way they are for an
    // event in a batch.
    description: 'Error: a single event throws rather than reporting a rejection',
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
      externalAudienceId: UNOWNED_AUDIENCE_ID,
      userId: 'e2e-dv360-err-single',
      email: 'e2e-dv360-err-single@segment.com'
    }),
    expect: { status: 'error', httpStatus: 400, errorType: 'IntegrationError', errorMessage: NOT_OWNED },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
