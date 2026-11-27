/**
 * Component test config and suites for Webhook (actions-webhook).
 *
 * No secrets are required: the destination's only setting, `sharedSecret`, is optional, and the
 * fixtures deliver to the public echo service httpbin.org, which reflects back what we sent.
 */
import type { CTDestinationConfig, CTSuite } from '../../../lib/component-test/types'
import definition from '..'
import sendFixtures from '../send/__component-test__/fixtures.ct'

export const config: CTDestinationConfig = {
  settings: {}
}

export const suites: CTSuite[] = [
  // httpbin.org is a shared public service; one retry absorbs an occasional blip.
  { destination: 'webhook', action: 'send', definition, config, fixtures: sendFixtures, retries: 1 }
]
