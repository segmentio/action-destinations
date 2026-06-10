import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2ERetlAudienceEvent } from '@segment/actions-core'
import userList from '../index'

const COMPUTATION_KEY = 'e2e_test_user_list'
const COMPUTATION_ID = 'aud_e2e_google_retl_001'

const FAILURE_HINT = 'Ensure GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID, GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET, and ADWORDS_DEVELOPER_TOKEN env vars are set. The customerId must be a valid Google Ads account.'

const fixtures: E2EFixture[] = [
  {
    description: 'RETL Audience: syncMode=add adds users from a batch of "new" events',
    subscribe: 'event = "new"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'add'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-001',
        email: 'e2e-google-retl-001@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-002',
        email: 'e2e-google-retl-002@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200 },
        { status: 200 }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL Audience: syncMode=delete removes users from a batch of "deleted" events',
    subscribe: 'event = "deleted"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'delete'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-003',
        email: 'e2e-google-retl-003@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-004',
        email: 'e2e-google-retl-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200 },
        { status: 200 }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL Audience: syncMode=mirror adds users from a batch of "new" events',
    subscribe: 'event = "new"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-005',
        email: 'e2e-google-retl-005@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-006',
        email: 'e2e-google-retl-006@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200 },
        { status: 200 }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL Audience: syncMode=mirror removes users from a batch of "deleted" events',
    subscribe: 'event = "deleted"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-007',
        email: 'e2e-google-retl-007@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-008',
        email: 'e2e-google-retl-008@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200 },
        { status: 200 }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
