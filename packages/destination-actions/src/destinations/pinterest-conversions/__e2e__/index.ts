import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    ad_account_id: { $env: 'E2E_PINTEREST_AD_ACCOUNT_ID' },
    conversion_token: { $env: 'E2E_PINTEREST_CONVERSION_TOKEN' }
  }
}
