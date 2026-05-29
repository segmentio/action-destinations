import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'

const COMPUTATION_KEY = 'e2e_test_audience_track'
const COMPUTATION_ID = 'aud_e2e_test_001'

const fixtures: E2EFixture[] = [
  {
    description: 'Add a single user via track event',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
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
    description: 'Remove a single user via track event',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
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
    description: 'Batch add and remove users',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'add',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-amp-user-002',
      email: 'e2e-user-002@segment.com'
    }),
    expect: { status: 'success' }
  }
]

export default fixtures
