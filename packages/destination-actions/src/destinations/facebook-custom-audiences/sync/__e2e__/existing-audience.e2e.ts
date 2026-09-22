import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_existing_audience'
const COMPUTATION_ID = 'aud_e2e_facebook_existing_001'

// Must match EXISTING_AUDIENCE_ID in the destination's __e2e__/index.ts, where it is supplied as the
// existingAudienceId audience setting. Asserting it in the response body proves createAudience connected
// to that audience instead of creating a new one: Facebook echoes back the audience it wrote to.
const EXISTING_AUDIENCE_ID = '120251031521470690'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set, the token has ads_management permission, and Facebook Custom Audience ' +
  EXISTING_AUDIENCE_ID +
  ' still exists in that ad account.'

const fixtures: E2EFixture[] = [
  {
    description: 'Existing audience: add a user to the audience connected via Existing Audience ID',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(sync.fields),
    mode: 'single',
    audience: 'existing',
    event: createE2EEngageAudienceEvent({
      type: 'identify',
      action: 'add',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId:existing',
      userId: 'e2e-fb-existing-001',
      email: 'e2e-fb-existing-001@segment.com'
    }),
    expect: { status: 'success', bodyContains: EXISTING_AUDIENCE_ID },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Existing audience: remove a user from the audience connected via Existing Audience ID',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(sync.fields),
    mode: 'single',
    audience: 'existing',
    event: createE2EEngageAudienceEvent({
      type: 'identify',
      action: 'remove',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId:existing',
      userId: 'e2e-fb-existing-001',
      email: 'e2e-fb-existing-001@segment.com'
    }),
    expect: { status: 'success', bodyContains: EXISTING_AUDIENCE_ID },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
