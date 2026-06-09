import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_audience'
const COMPUTATION_ID = 'aud_e2e_facebook_001'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set. The token must have ads_management permission.'

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
      jsonContains: [{ status: 200 }, { status: 200 }, { status: 200 }]
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
      jsonContains: [{ status: 200 }, { status: 200 }, { status: 200 }]
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
      jsonContains: [
        { status: 200 },
        { status: 200 },
        { status: 200 },
        { status: 200 },
        { status: 200 }
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
        {
          status: 200,
          body: {},
          sent: { externalId: 'e2e-fb-user-008', email: 'e2e-fb-test-008@segment.com' }
        },
        {
          status: 200,
          body: {},
          sent: { externalId: 'e2e-fb-user-009', email: 'e2e-fb-test-009@segment.com' }
        },
        {
          status: 200,
          body: {},
          sent: { externalId: 'e2e-fb-user-010', email: 'e2e-fb-test-010@segment.com' }
        },
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
