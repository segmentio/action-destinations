import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    client_id: { $env: 'E2E_MARKETO_PRIVATE_CLIENT_ID' },
    client_secret: { $env: 'E2E_MARKETO_PRIVATE_CLIENT_SECRET' },
    // Base REST domain WITHOUT the trailing /rest, e.g. https://123-ABC-456.mktorest.com
    marketo_api_domain: { $env: 'E2E_MARKETO_PRIVATE_API_DOMAIN' },
    // The destination uses the oauth2 scheme and mints a token reactively on the first 401.
    // The platform persists the refreshed token into settings.oauth.access_token via
    // updateOAuthSettings, which only writes if settings.oauth already exists. Seed an empty
    // oauth object so the minted token has somewhere to land (mirrors the google-enhanced-conversions
    // e2e config's `access_token: 'will_be_refreshed'` placeholder).
    oauth: {
      access_token: 'will_be_refreshed',
      refresh_token: 'unused'
    }
  }
}
