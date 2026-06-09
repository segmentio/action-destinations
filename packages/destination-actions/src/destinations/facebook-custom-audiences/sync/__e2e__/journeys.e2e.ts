import type { E2EFixture } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_journeys'
const COMPUTATION_ID = 'aud_e2e_facebook_journeys_001'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set. The facebook-custom-audience-actions-journeys-support feature flag must be enabled.'

function createJourneysEvent(options: { userId: string; email: string; externalAudienceId: string }) {
  return {
    type: 'track' as const,
    event: 'Journeys Step Entered',
    messageId: '$guid',
    timestamp: '$now',
    userId: options.userId,
    properties: {
      email: options.email
    },
    context: {
      personas: {
        computation_class: 'journey_step',
        computation_key: COMPUTATION_KEY,
        computation_id: COMPUTATION_ID,
        external_audience_id: options.externalAudienceId
      },
      traits: { email: options.email }
    }
  }
}

const fixtures: E2EFixture[] = [
  {
    description: 'Journeys: single event adds user regardless of property value',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'single',
    event: createJourneysEvent({
      userId: 'e2e-fb-journeys-user-001',
      email: 'e2e-fb-journeys-001@segment.com',
      externalAudienceId: '$externalAudienceId'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Journeys: batch adds all users (membership forced to true)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createJourneysEvent({
        userId: 'e2e-fb-journeys-user-002',
        email: 'e2e-fb-journeys-002@segment.com',
        externalAudienceId: '$externalAudienceId'
      }),
      createJourneysEvent({
        userId: 'e2e-fb-journeys-user-003',
        email: 'e2e-fb-journeys-003@segment.com',
        externalAudienceId: '$externalAudienceId'
      }),
      createJourneysEvent({
        userId: 'e2e-fb-journeys-user-004',
        email: 'e2e-fb-journeys-004@segment.com',
        externalAudienceId: '$externalAudienceId'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200 }, { status: 200 }, { status: 200 }]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
