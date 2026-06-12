import type { E2EFixture } from '@segment/actions-core'
import {
  defaultValues,
  createE2EJourneysV1AudienceEvent,
  createE2EEngageAudienceEvent,
  createE2ERetlAudienceEvent
} from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_errors'
const COMPUTATION_ID = 'aud_e2e_facebook_errors_001'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set. The token must have ads_management permission.'

// Error / validation paths. These never reach Facebook — the action rejects them locally.
const fixtures: E2EFixture[] = [
  {
    // A batch mixing journey_step and non-journey_step events is rejected wholesale with a thrown
    // InvalidAudienceMembershipError (the entire batch fails, not per-item).
    description: 'Error: batch mixing journey_step and non-journey_step events is rejected',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-err-journey-001',
        email: 'e2e-fb-err-journey-001@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-err-engage-001',
        email: 'e2e-fb-err-engage-001@segment.com'
      })
    ],
    expect: {
      status: 'error',
      errorType: 'InvalidAudienceMembershipError',
      errorMessage:
        'Batch contains a mix of journey_step and non-journey_step events. All events in a batch must be the same computation_class.'
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // No audience id resolvable (events carry no external_audience_id and no hook output) => each
    // payload gets a per-item INVALID_AUDIENCE_MEMBERSHIP error. Never reaches Facebook.
    description: 'Error: batch with missing audience ID returns per-item INVALID_AUDIENCE_MEMBERSHIP',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        userId: 'e2e-fb-err-noaud-001',
        email: 'e2e-fb-err-noaud-001@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        userId: 'e2e-fb-err-noaud-002',
        email: 'e2e-fb-err-noaud-002@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 400, errortype: 'INVALID_AUDIENCE_MEMBERSHIP', errormessage: 'Missing audience ID.', errorreporter: 'DESTINATION' },
        { status: 400, errortype: 'INVALID_AUDIENCE_MEMBERSHIP', errormessage: 'Missing audience ID.', errorreporter: 'DESTINATION' }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // RETL "new" events with no audience id => per-item INVALID_AUDIENCE_MEMBERSHIP.
    description: 'Error: RETL batch with missing audience ID returns per-item INVALID_AUDIENCE_MEMBERSHIP',
    subscribe: 'type = "track" or type = "identify"',
    mapping: {
      ...defaultValues(sync.fields),
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        userId: 'e2e-fb-err-retl-001',
        email: 'e2e-fb-err-retl-001@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 400, errortype: 'INVALID_AUDIENCE_MEMBERSHIP', errormessage: 'Missing audience ID.', errorreporter: 'DESTINATION' }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Passes local validation (audience id is a non-empty string) but Facebook rejects it because the
    // audience does not exist. Exercises the parseFacebookError path end-to-end. The exact errortype/
    // errormessage come from Facebook's live response, so we assert only the per-item 400 + reporter;
    // tighten these once we observe the real response from a live run.
    description: 'Error: Facebook rejects an invalid/non-existent audience ID (per-item API error)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '000000000000000', // well-formed but non-existent audience id
        userId: 'e2e-fb-err-fbapi-001',
        email: 'e2e-fb-err-fbapi-001@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [{ status: 400, errorreporter: 'DESTINATION' }]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
