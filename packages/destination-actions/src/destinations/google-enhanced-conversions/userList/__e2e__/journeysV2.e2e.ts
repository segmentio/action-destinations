import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EJourneysV2AudienceEvent } from '@segment/actions-core'
import userList from '../index'

const COMPUTATION_KEY = 'e2e_test_user_list'
const COMPUTATION_ID = 'journey_e2e_google_v2_001'

const FAILURE_HINT =
  'Ensure GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID, GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET, and ADWORDS_DEVELOPER_TOKEN env vars are set. The customerId must be a valid Google Ads account.'

const fixtures: E2EFixture[] = [
  {
    description: 'JourneysV2 Audience: Add a user to the customer match list via journey_step track event',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'single',
    event: createE2EJourneysV2AudienceEvent({
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      journeyName: 'e2e journey v2',
      userId: 'e2e-google-journeysv2-user-001',
      email: 'e2e-google-journeysv2-test-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'JourneysV2 Audience: Add a user with default syncMode (mirror) via journey_step track event',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'single',
    event: createE2EJourneysV2AudienceEvent({
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      journeyName: 'e2e journey v2',
      userId: 'e2e-google-journeysv2-user-002',
      email: 'e2e-google-journeysv2-test-002@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'JourneysV2 Audience: Batch add users to the customer match list via journey_step track events',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2EJourneysV2AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        journeyName: 'e2e journey v2',
        userId: 'e2e-google-journeysv2-user-003',
        email: 'e2e-google-journeysv2-test-003@segment.com'
      }),
      createE2EJourneysV2AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        journeyName: 'e2e journey v2',
        userId: 'e2e-google-journeysv2-user-004',
        email: 'e2e-google-journeysv2-test-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200 }, { status: 200 }]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
