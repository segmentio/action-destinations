import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EJourneysV1AudienceEvent } from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_journeys'
const COMPUTATION_ID = 'aud_e2e_facebook_journeys_001'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set. The token must have ads_management permission.'

// Journeys V1: journey_step events that do NOT carry a per-event membership boolean. The action
// fills membership with all-true (getJourneysV1Memberships), so every user is added (V1 has no
// remove path). Events therefore must omit enrichedTraits[computation_key].
//
// Note: the `sent` object also includes `audienceId`, but we intentionally do not assert it here.
// It resolves to the audience created during the e2e run (a different id each run), and the runner
// does not substitute the $externalAudienceId marker inside expectations — so there is no stable
// value to assert. We assert the operation (method) and the hashed identifier row instead.
const fixtures: E2EFixture[] = [
  {
    description: 'JourneysV1: single journey_step event adds the user',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'single',
    event: createE2EJourneysV1AudienceEvent({
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-fb-journeys-user-001',
      email: 'e2e-fb-journeys-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'JourneysV1: batch adds all users (membership defaulted to true)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-journeys-user-002',
        email: 'e2e-fb-journeys-002@segment.com'
      }),
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-journeys-user-003',
        email: 'e2e-fb-journeys-003@segment.com'
      }),
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-journeys-user-004',
        email: 'e2e-fb-journeys-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      // All journey_step events with no membership boolean => all added => POST.
      jsonContains: [
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-journeys-user-002', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-journeys-user-003', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-journeys-user-004', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Batch with a schema-invalid event (missing externalId) interleaved between valid ones. The
    // invalid payload is rejected with a per-item validation error; the surviving valid journey
    // events are still added at their correct indexes (and not failed wholesale).
    description: 'JourneysV1: batch with a mix of valid adds and an invalid payload',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-journeys-user-005',
        email: 'e2e-fb-journeys-005@segment.com'
      }),
      {
        // Invalid: externalId removed => fails schema validation before reaching Facebook.
        ...createE2EJourneysV1AudienceEvent({
          computationKey: COMPUTATION_KEY,
          computationId: COMPUTATION_ID,
          externalAudienceId: '$externalAudienceId',
          userId: 'e2e-fb-journeys-user-006',
          email: 'e2e-fb-journeys-006@segment.com'
        }),
        userId: undefined as unknown as string
      },
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-journeys-user-007',
        email: 'e2e-fb-journeys-007@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-journeys-user-005', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } },
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: "The root value is missing the required field 'externalId'.",
          errorreporter: 'INTEGRATIONS'
        },
        { status: 200, sent: { method: 'POST', data: ['e2e-fb-journeys-user-007', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
