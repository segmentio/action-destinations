import type { E2EAudienceFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'

const COMPUTATION_KEY = 'e2e_test_audience_track'
const COMPUTATION_ID = 'aud_e2e_test_001'

const fixtures: E2EAudienceFixture[] = [
  {
    description: 'Full audience lifecycle with track events',
    audienceName: COMPUTATION_KEY,
    audienceSettings: {
      id_type: 'BY_USER_ID'
    },
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
    steps: [
      {
        type: 'createAudience',
        description: 'Create cohort on Amplitude',
        expect: { status: 'success' }
      },
      {
        type: 'syncAudience',
        description: 'Add a single user via track event',
        mode: 'single',
        event: createE2EEngageAudienceEvent({
          type: 'track',
          action: 'add',
          computationKey: COMPUTATION_KEY,
          computationId: COMPUTATION_ID,
          externalAudienceId: '$externalAudienceId',
          userId: 'e2e-amp-user-001',
          email: 'e2e-user-001@segment.com'
        }),
        expect: { status: 'success' }
      },
      {
        type: 'syncAudience',
        description: 'Remove a single user via track event',
        mode: 'single',
        event: createE2EEngageAudienceEvent({
          type: 'track',
          action: 'remove',
          computationKey: COMPUTATION_KEY,
          computationId: COMPUTATION_ID,
          externalAudienceId: '$externalAudienceId',
          userId: 'e2e-amp-user-001',
          email: 'e2e-user-001@segment.com'
        }),
        expect: { status: 'success' }
      },
      {
        type: 'syncAudience',
        description: 'Batch add and remove users',
        mode: 'batch',
        events: [
          createE2EEngageAudienceEvent({
            type: 'track',
            action: 'add',
            computationKey: COMPUTATION_KEY,
            computationId: COMPUTATION_ID,
            externalAudienceId: '$externalAudienceId',
            userId: 'e2e-amp-user-002',
            email: 'e2e-user-002@segment.com'
          }),
          createE2EEngageAudienceEvent({
            type: 'track',
            action: 'add',
            computationKey: COMPUTATION_KEY,
            computationId: COMPUTATION_ID,
            externalAudienceId: '$externalAudienceId',
            userId: 'e2e-amp-user-003',
            email: 'e2e-user-003@segment.com'
          }),
          createE2EEngageAudienceEvent({
            type: 'track',
            action: 'remove',
            computationKey: COMPUTATION_KEY,
            computationId: COMPUTATION_ID,
            userId: 'e2e-amp-user-001',
            email: 'e2e-user-001@segment.com'
          })
        ],
        expect: { status: 'success' }
      },
      {
        type: 'getAudience',
        description: 'Verify cohort still exists',
        expect: { status: 'success' }
      }
    ]
  }
]

export default fixtures
