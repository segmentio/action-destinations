import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'

const COMPUTATION_KEY = 'e2e_test_audience'
const COMPUTATION_ID = 'aud_e2e_iterable_001'

const FAILURE_HINT = 'Ensure the Iterable API key has server-side permissions and the project is configured as hybrid.'

const fixtures: E2EFixture[] = [
  {
    description: 'Subscribe a user to the list via identify event',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
    mode: 'single',
    event: createE2EEngageAudienceEvent({
      type: 'identify',
      action: 'add',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-iterable-aud-user-001',
      email: 'e2e-aud-test-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Unsubscribe a user from the list via identify event',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
    mode: 'single',
    event: createE2EEngageAudienceEvent({
      type: 'identify',
      action: 'remove',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-iterable-aud-user-001',
      email: 'e2e-aud-test-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Batch subscribe and unsubscribe users',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-iterable-aud-user-002',
        email: 'e2e-aud-test-002@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-iterable-aud-user-003',
        email: 'e2e-aud-test-003@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-iterable-aud-user-001',
        email: 'e2e-aud-test-001@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200 },
        { status: 200 },
        { status: 200 }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
