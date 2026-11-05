/**
 * Required environment variables:
 * - E2E_CHATGPT_CONVERSIONS_API_PIXEL_ID: Pixel ID from the Conversions tab in Ads Manager.
 * - E2E_CHATGPT_CONVERSIONS_API_API_KEY:  Conversions API key from the same tab.
 *
 * validate_only is on, so ChatGPT Conversions API validates every event without saving it.
 */
import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    pixel_id: { $env: 'E2E_CHATGPT_CONVERSIONS_API_PIXEL_ID' },
    api_key: { $env: 'E2E_CHATGPT_CONVERSIONS_API_API_KEY' },
    validate_only: true
  }
}
