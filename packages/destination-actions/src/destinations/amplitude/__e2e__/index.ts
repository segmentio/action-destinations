import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    apiKey: { $env: 'E2E_AMPLITUDE_API_KEY' },
    secretKey: { $env: 'E2E_AMPLITUDE_SECRET_KEY' },
    endpoint: 'north_america'
  }
}
