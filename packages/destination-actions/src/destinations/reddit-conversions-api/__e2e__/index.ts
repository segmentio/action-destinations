import type { E2EDestinationConfig } from '@segment/actions-core'

/*
 * Environment variables required to run the Reddit Conversions API e2e tests:
 *
 *   E2E_REDDIT_AD_ACCOUNT_ID     - Pixel ID / ad account ID for the e2e test account.
 *   E2E_REDDIT_CONVERSION_TOKEN  - Conversion access token for that ad account.
 *
 * These fixtures send real production conversion events to Reddit (no test_id / Event Testing
 * routing is configured) - the ad account used here should be a disposable/sandbox account with
 * no real ad spend or attribution reporting tied to it.
 */
export const config: E2EDestinationConfig = {
  settings: {
    ad_account_id: { $env: 'E2E_REDDIT_AD_ACCOUNT_ID' },
    conversion_token: { $env: 'E2E_REDDIT_CONVERSION_TOKEN' }
  }
}
