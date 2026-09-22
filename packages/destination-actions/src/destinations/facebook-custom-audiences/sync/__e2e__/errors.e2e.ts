import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_errors'
const COMPUTATION_ID = 'aud_e2e_facebook_errors_001'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set. The token must have ads_management permission.'

// Error / validation paths. These never reach Facebook — the action rejects them locally.
const fixtures: E2EFixture[] = [
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
