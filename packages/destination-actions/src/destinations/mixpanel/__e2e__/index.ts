/**
 * Required environment variables:
 * - E2E_MIXPANEL_PROJECT_TOKEN: Mixpanel project token (used by all actions, and by the
 *   Import Events API when the `actions-mixpanel-project-token-auth` flag is ON).
 * - E2E_MIXPANEL_API_SECRET: Mixpanel project API secret (used by the Import Events API
 *   when the flag is OFF — i.e. trackEvent / trackPurchase batch + single).
 */
import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    projectToken: { $env: 'E2E_MIXPANEL_PROJECT_TOKEN' },
    apiSecret: { $env: 'E2E_MIXPANEL_API_SECRET' },
    apiRegion: 'US 🇺🇸',
    strictMode: '1'
  }
}
