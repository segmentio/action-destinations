import type { E2EDestinationConfig, E2EAudienceFixture } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import syncAudience from '../syncAudience'

export const config: E2EDestinationConfig = {
  settings: {
    api_key: { $env: 'E2E_AMPLITUDE_COHORTS_API_KEY' },
    secret_key: { $env: 'E2E_AMPLITUDE_COHORTS_SECRET_KEY' },
    app_id: { $env: 'E2E_AMPLITUDE_COHORTS_APP_ID' },
    default_owner_email: { $env: 'E2E_AMPLITUDE_COHORTS_OWNER_EMAIL' },
    endpoint: 'north_america'
  }
}

export const audienceFixtures: E2EAudienceFixture[] = [
  {
    description: 'Full audience lifecycle with track events',
    audienceName: 'e2e_test_audience_track',
    audienceSettings: {
      id_type: 'BY_USER_ID'
    },
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
    steps: [
      {
        type: 'createAudience',
        expect: { status: 'success' }
      },
      {
        type: 'syncAudience',
        mode: 'single',
        event: { eventType: 'track', action: 'add', userId: 'e2e-amp-user-001', email: 'e2e-user-001@segment.com' },
        expect: { status: 'success' }
      },
      {
        type: 'syncAudience',
        mode: 'single',
        event: { eventType: 'track', action: 'remove', userId: 'e2e-amp-user-001', email: 'e2e-user-001@segment.com' },
        expect: { status: 'success' }
      },
      {
        type: 'syncAudience',
        mode: 'batch',
        events: [
          { eventType: 'track', action: 'add', userId: 'e2e-amp-user-002', email: 'e2e-user-002@segment.com' },
          { eventType: 'track', action: 'add', userId: 'e2e-amp-user-003', email: 'e2e-user-003@segment.com' },
          { eventType: 'track', action: 'remove', userId: 'e2e-amp-user-001', email: 'e2e-user-001@segment.com' }
        ],
        expect: { status: 'success' }
      },
      {
        type: 'getAudience',
        expect: { status: 'success' }
      }
    ]
  },
  {
    description: 'Full audience lifecycle with identify events',
    audienceName: 'e2e_test_audience_identify',
    audienceSettings: {
      id_type: 'BY_USER_ID'
    },
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
    steps: [
      {
        type: 'createAudience',
        expect: { status: 'success' }
      },
      {
        type: 'syncAudience',
        mode: 'single',
        event: { eventType: 'identify', action: 'add', userId: 'e2e-amp-user-004', email: 'e2e-user-004@segment.com' },
        expect: { status: 'success' }
      },
      {
        type: 'syncAudience',
        mode: 'batch',
        events: [
          { eventType: 'identify', action: 'add', userId: 'e2e-amp-user-005', email: 'e2e-user-005@segment.com' },
          { eventType: 'identify', action: 'remove', userId: 'e2e-amp-user-004', email: 'e2e-user-004@segment.com' }
        ],
        expect: { status: 'success' }
      },
      {
        type: 'getAudience',
        expect: { status: 'success' }
      }
    ]
  }
]
