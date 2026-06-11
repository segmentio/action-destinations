import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2ERetlAudienceEvent } from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_retl'
const COMPUTATION_ID = 'aud_e2e_facebook_retl_001'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set. The token must have ads_management permission.'

const fixtures: E2EFixture[] = [
  {
    description: 'RETL: single entity added (track "new" event)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: {
      ...defaultValues(sync.fields),
      __segment_internal_sync_mode: 'add'
    },
    mode: 'single',
    event: createE2ERetlAudienceEvent({
      eventName: 'new',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-fb-retl-user-001',
      email: 'e2e-fb-retl-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL: single entity removed (track "deleted" event)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: {
      ...defaultValues(sync.fields),
      __segment_internal_sync_mode: 'delete'
    },
    mode: 'single',
    event: createE2ERetlAudienceEvent({
      eventName: 'deleted',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-fb-retl-user-002',
      email: 'e2e-fb-retl-002@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL: batch entity added (syncMode=mirror, "new" events)',
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
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-003',
        email: 'e2e-fb-retl-003@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-004',
        email: 'e2e-fb-retl-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200 }, { status: 200 }]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL: batch entity removed (syncMode=mirror, "deleted" events)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: {
      ...defaultValues(sync.fields),
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-005',
        email: 'e2e-fb-retl-005@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-006',
        email: 'e2e-fb-retl-006@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200 }, { status: 200 }]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL: batch mixed add and remove (syncMode=mirror, "new" + "deleted" events)',
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
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-007',
        email: 'e2e-fb-retl-007@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-008',
        email: 'e2e-fb-retl-008@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-003',
        email: 'e2e-fb-retl-003@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-retl-user-004',
        email: 'e2e-fb-retl-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200 }, { status: 200 }, { status: 200 }, { status: 200 }]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
