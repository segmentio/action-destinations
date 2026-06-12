import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EJourneysV2AudienceEvent } from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_journeys_v2'
const COMPUTATION_ID = 'aud_e2e_facebook_journeys_v2_001'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set. The token must have ads_management permission.'

// Journeys V2: journey_step events that DO carry a per-event membership boolean
// (properties[computation_key]). Because membership is already populated, the V1 all-true override
// is skipped and the boolean drives the operation: true => add (POST), false => remove (DELETE).
//
// Note: the `sent` object also includes `audienceId`, but we intentionally do not assert it here.
// It resolves to the audience created during the e2e run (a different id each run), and the runner
// does not substitute the $externalAudienceId marker inside expectations — so there is no stable
// value to assert. We assert the operation (method) and the hashed identifier row instead.
const fixtures: E2EFixture[] = [
  {
    description: 'JourneysV2: single journey_step event with membership=true adds the user',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'single',
    event: createE2EJourneysV2AudienceEvent({
      action: 'add',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      journeyName: 'e2e journey v2',
      userId: 'e2e-fb-journeysv2-user-001',
      email: 'e2e-fb-journeysv2-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'JourneysV2: single journey_step event with membership=false removes the user',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'single',
    event: createE2EJourneysV2AudienceEvent({
      action: 'remove',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      journeyName: 'e2e journey v2',
      userId: 'e2e-fb-journeysv2-user-002',
      email: 'e2e-fb-journeysv2-002@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'JourneysV2: batch with mixed add and remove driven by membership boolean',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EJourneysV2AudienceEvent({
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        journeyName: 'e2e journey v2',
        userId: 'e2e-fb-journeysv2-user-003',
        email: 'e2e-fb-journeysv2-003@segment.com'
      }),
      createE2EJourneysV2AudienceEvent({
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        journeyName: 'e2e journey v2',
        userId: 'e2e-fb-journeysv2-user-004',
        email: 'e2e-fb-journeysv2-004@segment.com'
      }),
      createE2EJourneysV2AudienceEvent({
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        journeyName: 'e2e journey v2',
        userId: 'e2e-fb-journeysv2-user-005',
        email: 'e2e-fb-journeysv2-005@segment.com'
      })
    ],
    expect: {
      status: 'success',
      // Membership boolean drives the op: index 0,2 add (POST), index 1 remove (DELETE).
      jsonContains: [
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-journeysv2-user-003', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-journeysv2-user-004', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-journeysv2-user-005', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Batch mixing a valid add, a valid remove, and a schema-invalid event (missing externalId). The
    // invalid payload gets a per-item validation error; the valid add/remove succeed at their indexes.
    description: 'JourneysV2: batch with a mix of valid add, valid remove and an invalid payload',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EJourneysV2AudienceEvent({
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        journeyName: 'e2e journey v2',
        userId: 'e2e-fb-journeysv2-user-006',
        email: 'e2e-fb-journeysv2-006@segment.com'
      }),
      createE2EJourneysV2AudienceEvent({
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        journeyName: 'e2e journey v2',
        userId: 'e2e-fb-journeysv2-user-007',
        email: 'e2e-fb-journeysv2-007@segment.com'
      }),
      {
        // Invalid: externalId removed => fails schema validation before reaching Facebook.
        ...createE2EJourneysV2AudienceEvent({
          action: 'add',
          computationKey: COMPUTATION_KEY,
          computationId: COMPUTATION_ID,
          externalAudienceId: '$externalAudienceId',
          journeyName: 'e2e journey v2',
          userId: 'e2e-fb-journeysv2-user-008',
          email: 'e2e-fb-journeysv2-008@segment.com'
        }),
        userId: undefined as unknown as string
      }
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-journeysv2-user-006', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'DELETE', data: ['e2e-fb-journeysv2-user-007', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
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
