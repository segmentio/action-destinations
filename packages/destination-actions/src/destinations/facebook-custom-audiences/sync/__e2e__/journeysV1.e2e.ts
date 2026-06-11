import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EJourneysV1AudienceEvent } from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_journeys'
const COMPUTATION_ID = 'aud_e2e_facebook_journeys_001'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set. The facebook-custom-audience-actions-journeys-support feature flag must be enabled.'

const fixtures: E2EFixture[] = [
  {
    description: 'JourneysV1: single event adds user regardless of property value',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'single',
    event: createE2EJourneysV1AudienceEvent({
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      eventName: 'Journeys Step Entered',
      userId: 'e2e-fb-journeys-user-001',
      email: 'e2e-fb-journeys-001@segment.com',
      enrichedTraits: { [COMPUTATION_KEY]: true }
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'JourneysV1: batch adds all users (membership forced to true)',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        eventName: 'Journeys Step Entered',
        userId: 'e2e-fb-journeys-user-002',
        email: 'e2e-fb-journeys-002@segment.com',
        enrichedTraits: { [COMPUTATION_KEY]: true }
      }),
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        eventName: 'Journeys Step Entered',
        userId: 'e2e-fb-journeys-user-003',
        email: 'e2e-fb-journeys-003@segment.com',
        enrichedTraits: { [COMPUTATION_KEY]: true }
      }),
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        eventName: 'Journeys Step Entered',
        userId: 'e2e-fb-journeys-user-004',
        email: 'e2e-fb-journeys-004@segment.com',
        enrichedTraits: { [COMPUTATION_KEY]: true }
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
