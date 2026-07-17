/**
 * E2E config for the LinkedIn Audiences destination.
 *
 * These tests exercise the `updateCompanyAudience` action against LinkedIn's real
 * DMP Segment Companies API (`POST /rest/dmpSegments/{id}/companies`, account-based marketing).
 *
 * The action resolves its DMP Company Segment at perform time (no mapping-save hooks): it looks the
 * segment up by `sourceSegmentId` via `GET /dmpSegments` and creates it if none exists. The lookup
 * key is the `computation_key` field when `audience_source` is ENGAGE_RETL, or the `segment_name`
 * field when it is CONNECTIONS. The fixtures therefore drive a real lookup-or-create flow: they use a
 * fixed key to populate an already-existing segment (created on the first run) and a unique per-run
 * key to exercise creation. No pre-created segment id is required.
 * See ./updateCompanyAudience/__e2e__/fixtures.e2e.ts.
 *
 * Required environment variables:
 * - E2E_LINKEDIN_AUDIENCES_ACCESS_TOKEN: OAuth access token with the `rw_dmp_segments` permission
 *   on an ad account where the member has a role other than VIEWER.
 * - E2E_LINKEDIN_AUDIENCES_AD_ACCOUNT_ID: LinkedIn Ad Account ID (numeric, e.g. 512345678).
 *
 * Note: the "creates a new audience" fixtures create a COMPANY segment per run. LinkedIn has no
 * segment-delete API, so these accumulate in the ad account and should be cleaned up manually in
 * Campaign Manager periodically.
 */
import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    ad_account_id: { $env: 'E2E_LINKEDIN_AUDIENCES_AD_ACCOUNT_ID' },
    send_email: true,
    send_google_advertising_id: true,
    oauth: {
      access_token: { $env: 'E2E_LINKEDIN_AUDIENCES_ACCESS_TOKEN' },
      refresh_token: 'unused'
    }
  }
}
