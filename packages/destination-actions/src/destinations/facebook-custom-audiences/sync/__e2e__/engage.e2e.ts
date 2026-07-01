import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_audience'
const COMPUTATION_ID = 'aud_e2e_facebook_001'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set. The token must have ads_management permission.'

// Note: the `sent` object also includes `audienceId`, but we intentionally do not assert it here.
// It resolves to the audience created during the e2e run (a different id each run), and the runner
// does not substitute the $externalAudienceId marker inside expectations — so there is no stable
// value to assert. We assert the operation (method) and the hashed identifier row instead.
const fixtures: E2EFixture[] = [
  {
    description: 'Single event: add a user to the audience via identify',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(sync.fields),
    mode: 'single',
    event: createE2EEngageAudienceEvent({
      type: 'identify',
      action: 'add',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-fb-user-001',
      email: 'e2e-fb-test-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Single event: remove a user from the audience via identify',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(sync.fields),
    mode: 'single',
    event: createE2EEngageAudienceEvent({
      type: 'identify',
      action: 'remove',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-fb-user-001',
      email: 'e2e-fb-test-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Batch: add multiple users to the audience',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-002',
        email: 'e2e-fb-test-002@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-003',
        email: 'e2e-fb-test-003@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-004',
        email: 'e2e-fb-test-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      // All adds => POST. data row is [externalId, hashedEmail, ...empty identifier slots].
      jsonContains: [
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-user-002', '2a0927f79c0d8dbf12ca428ba51bdb546b6e612e9cb65e6df4b75d637f8696f7', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-user-003', '63812a0b58b3d40cb802a69aae0208400c5da53341faacbadf11fbc2ed8bec5e', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-user-004', '36bca65f27804d68271e85dd6539bb601bc70b8d57a385480e95f7f5c8b8b281', '', '', '', '', '', '', '', '', '', '', '', '', ''] } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Batch: remove multiple users from the audience',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-002',
        email: 'e2e-fb-test-002@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-003',
        email: 'e2e-fb-test-003@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-004',
        email: 'e2e-fb-test-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      // All removes => DELETE.
      jsonContains: [
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-user-002', '2a0927f79c0d8dbf12ca428ba51bdb546b6e612e9cb65e6df4b75d637f8696f7', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-user-003', '63812a0b58b3d40cb802a69aae0208400c5da53341faacbadf11fbc2ed8bec5e', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-user-004', '36bca65f27804d68271e85dd6539bb601bc70b8d57a385480e95f7f5c8b8b281', '', '', '', '', '', '', '', '', '', '', '', '', ''] } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Batch: mixed add and remove users in a single batch',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-005',
        email: 'e2e-fb-test-005@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-006',
        email: 'e2e-fb-test-006@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-007',
        email: 'e2e-fb-test-007@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-002',
        email: 'e2e-fb-test-002@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-003',
        email: 'e2e-fb-test-003@segment.com'
      })
    ],
    expect: {
      status: 'success',
      // Indexes 0,1,2 are adds (POST); indexes 3,4 are removes (DELETE). Per-index sent operation
      // must stay aligned with the original payload order even though adds/removes are sent as
      // two separate Facebook requests.
      jsonContains: [
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-user-005', '63590a80cfc4b727847e97b64b7e908479597052effe780a02f2cd15113e17a0', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-user-006', 'c2f84c216f71811d7b0fc06d30d7784f0a9299587422477f68706d7d34f3334d', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-user-007', '242557ab9fdf0f9206600b352231fc4a8450c4a05a124fa1ee03fbc852ef7605', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-user-002', '2a0927f79c0d8dbf12ca428ba51bdb546b6e612e9cb65e6df4b75d637f8696f7', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-user-003', '63812a0b58b3d40cb802a69aae0208400c5da53341faacbadf11fbc2ed8bec5e', '', '', '', '', '', '', '', '', '', '', '', '', ''] } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Batch: mixed valid and invalid membership — valid events succeed, invalid gets error',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-008',
        email: 'e2e-fb-test-008@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-009',
        email: 'e2e-fb-test-009@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-user-010',
        email: 'e2e-fb-test-010@segment.com'
      }),
      {
        ...createE2EEngageAudienceEvent({
          type: 'identify',
          action: 'remove',
          computationKey: COMPUTATION_KEY,
          computationId: COMPUTATION_ID,
          externalAudienceId: '$externalAudienceId',
          userId: 'e2e-fb-user-011',
          email: 'e2e-fb-test-011@segment.com'
        }),
        userId: undefined as unknown as string
      }
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-user-008', 'b44ddc1f21dce143a163b617eae3f6e921a87398d708df0d0ba49593ae76c2d2', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-user-009', '6240c5bfbe17f3e6b17ed986031200b3a82b7dec9842d108a3106c87fb8a0130', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-user-010', '374bc76dbe337e73a7bbc0bfcb6b10f5df1f3efa62d48f747ee4d208a18b08cb', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: "The root value is missing the required field 'externalId'.",
          errorreporter: 'INTEGRATIONS'
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
