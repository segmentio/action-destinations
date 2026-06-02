import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EJourneysV1AudienceEvent } from '@segment/actions-core'
import userList from '../index'

const COMPUTATION_KEY = 'e2e_test_user_list'
const COMPUTATION_ID = 'aud_e2e_google_journeys_001'

const FAILURE_HINT = 'Ensure GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID, GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET, and ADWORDS_DEVELOPER_TOKEN env vars are set. The customerId must be a valid Google Ads account.'

const fixtures: E2EFixture[] = [
  {
    description: 'JourneysV1 Audience: Add a user to the customer match list via track event',
    subscribe: 'event = "Audience Entered" or event = "Audience Exited"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'single',
    event: createE2EJourneysV1AudienceEvent({
      action: 'add',
      eventName: 'Audience Entered',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-google-journeys-user-001',
      email: 'e2e-google-journeys-test-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'JourneysV1 Audience: Batch add users to the customer match list',
    subscribe: 'event = "Audience Entered" or event = "Audience Exited"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2EJourneysV1AudienceEvent({
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-journeys-user-002',
        email: 'e2e-google-journeys-test-002@segment.com'
      }),
      createE2EJourneysV1AudienceEvent({
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-journeys-user-003',
        email: 'e2e-google-journeys-test-003@segment.com'
      }),
      createE2EJourneysV1AudienceEvent({
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-journeys-user-004',
        email: 'e2e-google-journeys-test-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: {}, body: {} },
        { status: 200, sent: {}, body: {} },
        { status: 200, sent: {}, body: {} }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
