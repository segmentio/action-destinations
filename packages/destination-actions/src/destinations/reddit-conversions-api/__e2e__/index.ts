import type { E2EDestinationConfig } from '@segment/actions-core'

/*
 * Environment variables required to run the Reddit Conversions API e2e tests:
 *
 *   E2E_REDDIT_AD_ACCOUNT_ID     - Pixel ID / ad account ID for the e2e test account.
 *   E2E_REDDIT_CONVERSION_TOKEN  - Conversion access token for that ad account.
 *   E2E_REDDIT_TEST_ID           - Event Testing ID from Reddit's Events Manager (e.g. t2_...).
 *
 * The test ID only applies to V3: V3 events are routed to Reddit Event Testing instead of production.
 * V2 has no equivalent: the test_mode setting flags V2 events as test events, but they do not show
 * in Event Testing. The ad account used here should be a disposable/sandbox account with no real
 * ad spend or attribution reporting tied to it.
 */
export const config: E2EDestinationConfig = {
  settings: {
    ad_account_id: { $env: 'E2E_REDDIT_AD_ACCOUNT_ID' },
    conversion_token: { $env: 'E2E_REDDIT_CONVERSION_TOKEN' },
    test_id: { $env: 'E2E_REDDIT_TEST_ID' },
    test_mode: true
  }
}
