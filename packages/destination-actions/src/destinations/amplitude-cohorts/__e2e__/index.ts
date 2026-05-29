import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    api_key: { $env: 'E2E_AMPLITUDE_COHORTS_API_KEY' },
    secret_key: { $env: 'E2E_AMPLITUDE_COHORTS_SECRET_KEY' },
    app_id: { $env: 'E2E_AMPLITUDE_COHORTS_APP_ID' },
    default_owner_email: { $env: 'E2E_AMPLITUDE_COHORTS_OWNER_EMAIL' },
    endpoint: 'north_america'
  }
}
