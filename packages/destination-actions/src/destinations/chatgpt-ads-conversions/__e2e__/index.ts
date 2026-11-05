/**
 * Required environment variables:
 * - E2E_CHATGPT_ADS_PIXEL_ID: Pixel ID from the Conversions tab in ChatGPT Ads Manager.
 * - E2E_CHATGPT_ADS_API_KEY:  Conversions API key from the same tab.
 *
 * validate_only is on, so ChatGPT Ads validates every event without saving it.
 */
import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    pixel_id: { $env: 'E2E_CHATGPT_ADS_PIXEL_ID' },
    api_key: { $env: 'E2E_CHATGPT_ADS_API_KEY' },
    validate_only: true
  }
}
