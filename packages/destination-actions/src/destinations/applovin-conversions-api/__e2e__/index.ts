import type { E2EDestinationConfig } from '@segment/actions-core'

/*
 * Environment variables required to run the AppLovin Conversions API e2e tests:
 *
 *   E2E_APPLOVIN_CAPI_PIXEL_ID             - Event Key (pixel ID) of the AppLovin e2e test account.
 *   E2E_APPLOVIN_CAPI_SHARED_ACCESS_TOKEN  - Segment's shared Conversion API access token.
 *
 * AppLovin has no sandbox or test-event mode, and server events appear in Ads Manager after about
 * 2 hours with no per-event detail. The API only validates a request's structure synchronously, so a
 * 200 does not prove an event was attributed. Use the dedicated test account only.
 */
export const config: E2EDestinationConfig = {
  settings: {
    pixel_id: { $env: 'E2E_APPLOVIN_CAPI_PIXEL_ID' },
    api_key: { $env: 'E2E_APPLOVIN_CAPI_SHARED_ACCESS_TOKEN' }
  }
}
