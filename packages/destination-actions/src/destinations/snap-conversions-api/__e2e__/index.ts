/**
 * Required environment variables:
 * - E2E_SNAP_PIXEL_ID: Pixel ID of a disposable Snap ad account. Used for web and offline events.
 * - E2E_SNAP_APP_ID: Snap App ID. Used for app events.
 * - E2E_SNAP_MOBILE_APP_ID: App ID of the mobile app (numeric for iOS, a string for Android).
 * - E2E_SNAP_REFRESH_TOKEN: OAuth refresh token for the Snap account that owns the pixel.
 * - E2E_SNAP_CLIENT_ID: OAuth client ID used to refresh the token.
 * - E2E_SNAP_CLIENT_SECRET: OAuth client secret used to refresh the token.
 *
 * These fixtures send real conversion events to Snap (no test routing is configured), so the pixel
 * and app used here should belong to a disposable account with no real ad spend or reporting.
 */
import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    pixel_id: { $env: 'E2E_SNAP_PIXEL_ID' },
    snap_app_id: { $env: 'E2E_SNAP_APP_ID' },
    app_id: { $env: 'E2E_SNAP_MOBILE_APP_ID' },
    oauth: {
      access_token: 'will_be_refreshed',
      refresh_token: { $env: 'E2E_SNAP_REFRESH_TOKEN' },
      clientId: { $env: 'E2E_SNAP_CLIENT_ID' },
      clientSecret: { $env: 'E2E_SNAP_CLIENT_SECRET' }
    }
  }
}
