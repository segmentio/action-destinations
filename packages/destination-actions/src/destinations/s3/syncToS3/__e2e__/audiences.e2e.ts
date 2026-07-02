/**
 * E2E fixtures for audience events.
 *
 * The audience columns are populated from context.personas:
 *  - audience_name  <- computation_key
 *  - audience_id    <- computation_id
 *  - audience_action<- traits_or_props[computation_key]  (true = enter, false = exit)
 *
 * (audience_space_id is left empty — the e2e audience helpers don't set personas.space_id.)
 *
 * All audience source types (Engage/RETL/Journeys) resolve to the same S3 payload via the mapping
 * directives, so from the destination's perspective they are equivalent. These fixtures use Engage
 * events only and focus on what actually varies for S3: audience_action true vs false, single vs
 * batch. Success = the upload did not throw; inspect the bucket to confirm the audience columns.
 */
import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncToS3 from '../index'

const COMPUTATION_KEY = 'e2e_s3_audience'
const COMPUTATION_ID = 'aud_e2e_s3_001'

const FAILURE_HINT =
  'Ensure E2E_S3_* and AMAZON_S3_ACTIONS_* env vars are set and the IAM role can write to the bucket.'

const baseMapping = {
  ...defaultValues(syncToS3.fields),
  delimiter: ',',
  file_extension: 'csv',
  s3_aws_folder_name: 'e2e/audiences/'
}

const fixtures: E2EFixture[] = [
  {
    description: 'Audience (track): add a user (audience_action = enter)',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: { ...baseMapping, filename_prefix: 'aud-add' },
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'add',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      userId: 'e2e-s3-aud-user-001',
      email: 'e2e-s3-aud-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Audience (identify): remove a user (audience_action = exit)',
    subscribe: 'type = "identify"',
    mode: 'single',
    mapping: { ...baseMapping, filename_prefix: 'aud-remove' },
    event: createE2EEngageAudienceEvent({
      type: 'identify',
      action: 'remove',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      userId: 'e2e-s3-aud-user-002',
      email: 'e2e-s3-aud-002@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Audience (track): batch of enter + exit events',
    subscribe: 'type = "track"',
    mode: 'batch',
    mapping: { ...baseMapping, filename_prefix: 'aud-batch' },
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        userId: 'e2e-s3-aud-user-003',
        email: 'e2e-s3-aud-003@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        userId: 'e2e-s3-aud-user-004',
        email: 'e2e-s3-aud-004@segment.com'
      })
    ],
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
