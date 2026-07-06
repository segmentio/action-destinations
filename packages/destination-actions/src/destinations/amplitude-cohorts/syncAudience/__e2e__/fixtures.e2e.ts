import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'

const COMPUTATION_KEY = 'e2e_test_audience_track'
const COMPUTATION_ID = 'aud_e2e_test_001'

const FAILURE_HINT =
  'User IDs must exist in the Amplitude project before they can be added to or removed from a cohort. Ensure the test users have been created in Amplitude first.'

const fixtures: E2EFixture[] = [
  {
    description: 'Add a single user via track event',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
    mode: 'single',
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'add',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'segment-e2e-test-user-1',
      email: 'e2e-user-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Remove a single user via track event',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
    mode: 'single',
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'remove',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'segment-e2e-test-user-2',
      email: 'e2e-user-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Batch mixing valid users with one whose ID does not exist in Amplitude. The valid add and remove
    // succeed, while the nonexistent user is returned in `skipped_ids` (skip_invalid_ids: true) and
    // surfaced as a per-item 400 with the correct error message.
    description: 'Batch add and remove users',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'segment-e2e-test-user-3',
        email: 'e2e-user-002@segment.com'
      }),
      // This user ID does not exist in Amplitude, so it will be skipped and reported as a failure.
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'segment-e2e-nonexistent-user',
        email: 'e2e-user-003@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'segment-e2e-test-user-5',
        email: 'e2e-user-001@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200 },
        {
          status: 400,
          errortype: 'UNKNOWN_ERROR',
          errormessage:
            'The user with User ID segment-e2e-nonexistent-user was invalid and was not processed in the cohort update.'
        },
        { status: 200 }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
