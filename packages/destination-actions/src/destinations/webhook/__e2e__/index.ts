/**
 * E2E config for Webhook (actions-webhook).
 *
 * No secrets are required: the destination's only setting, `sharedSecret`, is optional, and the
 * fixtures deliver to the public echo service httpbin.org, which reflects back what we sent.
 */
import type { E2EDestinationConfig } from '../../../lib/e2e'

export const config: E2EDestinationConfig = {
  settings: {}
}
