import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    apiKey: { $env: 'E2E_ITERABLE_API_KEY' },
    dataCenterLocation: 'united_states'
  }
}
