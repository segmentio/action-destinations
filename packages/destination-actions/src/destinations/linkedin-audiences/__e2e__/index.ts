/**
 * E2E config for the LinkedIn Audiences destination.
 *
 * These tests exercise the `updateCompanyAudience` action against LinkedIn's real
 * DMP Segment Companies API (`POST /rest/dmpSegments/{id}/companies`, account-based marketing).
 *
 * The action is normally hook-gated: the mapping-save hook creates/selects a Company Segment and
 * supplies its id via hookOutputs. The e2e framework does not run mapping-save hooks, so instead
 * we point every fixture at a REAL, pre-created COMPANY-type DMP segment. Its id is injected into
 * each event at `context.personas.external_audience_id` and picked up by the action's hidden
 * `external_audience_id` fallback field. See ./updateCompanyAudience/__e2e__/fixtures.e2e.ts.
 *
 * Required environment variables:
 * - E2E_LINKEDIN_AUDIENCES_ACCESS_TOKEN: OAuth access token with the `rw_dmp_segments` permission
 *   on an ad account where the member has a role other than VIEWER.
 * - E2E_LINKEDIN_AUDIENCES_AD_ACCOUNT_ID: LinkedIn Ad Account ID (numeric, e.g. 512345678).
 * - E2E_LINKEDIN_COMPANY_SEGMENT_ID: ID of a pre-created COMPANY-type DMP segment to sync into
 *   (read directly from process.env inside the fixtures file, not via $env).
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
