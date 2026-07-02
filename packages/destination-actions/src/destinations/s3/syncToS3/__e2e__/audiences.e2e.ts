/**
 * E2E fixtures for audience events across the source types that feed S3.
 *
 * The audience columns are populated from context.personas:
 *  - audience_name  <- computation_key
 *  - audience_id    <- computation_id
 *  - audience_action<- traits_or_props[computation_key]  (true = enter, false = exit)
 *
 * (audience_space_id is left empty — the e2e audience helpers don't set personas.space_id.)
 *
 * Covers Engage (track + identify), RETL (new/deleted), and Journeys V2 (add/remove), in single and
 * batch modes. Success = the upload did not throw; inspect the bucket to confirm the audience columns
 * and audience_action values.
 */
import type { E2EFixture } from '@segment/actions-core'
import {
  defaultValues,
  createE2EEngageAudienceEvent,
  createE2ERetlAudienceEvent,
  createE2EJourneysV2AudienceEvent
} from '@segment/actions-core'
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
    description: 'Audience (Engage track): add a user (audience_action = enter)',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: baseMapping,
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
    description: 'Audience (Engage identify): remove a user (audience_action = exit)',
    subscribe: 'type = "identify"',
    mode: 'single',
    mapping: baseMapping,
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
    description: 'Audience (RETL): new row enters the audience',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: baseMapping,
    event: createE2ERetlAudienceEvent({
      eventName: 'new',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      userId: 'e2e-s3-aud-user-003',
      email: 'e2e-s3-aud-003@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Audience (Journeys V2): add via journey_step event',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: baseMapping,
    event: createE2EJourneysV2AudienceEvent({
      action: 'add',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      journeyName: 'e2e s3 journey',
      userId: 'e2e-s3-aud-user-004',
      email: 'e2e-s3-aud-004@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Audience (Engage track): batch of enter + exit events',
    subscribe: 'type = "track"',
    mode: 'batch',
    mapping: baseMapping,
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        userId: 'e2e-s3-aud-user-005',
        email: 'e2e-s3-aud-005@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        userId: 'e2e-s3-aud-user-006',
        email: 'e2e-s3-aud-006@segment.com'
      })
    ],
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
