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

const mapping = { ...defaultValues(syncAudience.fields), audience_type: CONTACT_INFO }

const event = (userId: string, externalAudienceId?: string) =>
  createE2EEngageAudienceEvent({
    type: 'track',
    action: 'add',
    eventName: 'Audience Entered',
    computationKey: COMPUTATION_KEY,
    computationId: COMPUTATION_ID,
    ...(externalAudienceId ? { externalAudienceId } : {}),
    userId,
    email: `${userId}@segment.com`
  })

// Rejections which only Display & Video 360 can produce. Everything the action decides for itself,
// such as a missing audience ID, an unusable identifier or a denied consent, never reaches the API
// and is covered by the unit tests.
//
// Both of these come back as 400 INVALID_ARGUMENT. The messages name the offending ids, which vary
// with the advertiser under test, so the assertions cover the status and the reporter rather than
// the wording:
//   'Audience "1234567890" is not owned by advertiser "<advertiser>".'
//   'The value "999999999" is not valid for field "advertiserId".'
const fixtures: E2EFixture[] = [
  {
    description: 'Error: an audience which the advertiser does not own is rejected by the API',
    subscribe: 'type = "track"',
    mapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [event('e2e-dv360-err-audience', '1234567890')],
    expect: {
      status: 'success',
      jsonContains: [{ status: 400, errortype: 'BAD_REQUEST', errorreporter: 'DESTINATION' }]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // The advertiser reaches the action through the mapping save hook here, so a warehouse mapping
    // pointing at the wrong advertiser fails the same way an audience setting would.
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
    events: [event('e2e-dv360-err-advertiser')],
    expect: {
      status: 'success',
      jsonContains: [{ status: 400, errortype: 'BAD_REQUEST', errorreporter: 'DESTINATION' }]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
