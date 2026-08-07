/**
 * Required environment variables:
 * - E2E_BRAZE_API_KEY: Braze REST API key with the `users.track` permission (Developer Console → REST API Keys).
 * - E2E_BRAZE_APP_ID:  Braze App Identifier (optional for users/track, sent as app_id on each event).
 *
 * The REST endpoint is fixed to the iad-01 (US-01) cluster the test workspace lives on.
 */
import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    api_key: { $env: 'E2E_BRAZE_API_KEY' },
    app_id: { $env: 'E2E_BRAZE_APP_ID' },
    endpoint: 'https://rest.iad-01.braze.com'
  }
}
