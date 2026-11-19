/**
 * E2E config and suites for Webhook (actions-webhook).
 *
 * No secrets are required: the destination's only setting, `sharedSecret`, is optional, and the
 * fixtures deliver to the public echo service httpbin.org, which reflects back what we sent.
 */
import type { E2EDestinationConfig, E2ESuite } from '../../../lib/e2e/types'
import definition from '..'
import sendFixtures from '../send/__e2e__/fixtures.e2e'

export const config: E2EDestinationConfig = {
  settings: {}
}

export const suites: E2ESuite[] = [
  // httpbin.org is a shared public service; one retry absorbs an occasional blip.
  { destination: 'webhook', action: 'send', definition, config, fixtures: sendFixtures, retries: 1 }
]
