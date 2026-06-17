import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    client_id: { $env: 'E2E_MARKETO_PRIVATE_CLIENT_ID' },
    client_secret: { $env: 'E2E_MARKETO_PRIVATE_CLIENT_SECRET' },
    // Base REST domain WITHOUT the trailing /rest, e.g. https://123-ABC-456.mktorest.com
    marketo_api_domain: { $env: 'E2E_MARKETO_PRIVATE_API_DOMAIN' }
  }
}
