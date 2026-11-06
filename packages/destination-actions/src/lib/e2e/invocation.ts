import { defaultValues } from '@segment/actions-core'
import type { JSONObject } from '@segment/actions-core'
import type { E2EInvocation } from './adapters/types'
import { resolveDynamicValues, resolveSettings } from './resolve'
import type { E2EFixture, E2ESuite } from './types'

/**
 * Build the adapter-neutral input for one fixture attempt. The mapping is the action's field
 * defaults overlaid with the fixture's, because a stored subscription (what Centrifuge sends)
 * already carries the defaults. One guid cache spans events and mapping, so '$guid:<name>' agrees.
 */
export function buildInvocation(suite: E2ESuite, fixture: E2EFixture, env: NodeJS.ProcessEnv): E2EInvocation {
  const action = suite.definition.actions[suite.action]
  if (!action) {
    throw new Error(`E2E: ${suite.destination} has no action "${suite.action}".`)
  }
  const guidCache = new Map<string, string>()
  const mapping = { ...defaultValues(action.fields), ...fixture.mapping } as JSONObject
  const events = fixture.mode === 'single' ? [fixture.event] : fixture.events

  return {
    slug: suite.definition.slug ?? suite.destination,
    action: suite.action,
    mode: fixture.mode,
    events: resolveDynamicValues(events, guidCache),
    settings: resolveSettings(suite.config.settings, env),
    subscribe: fixture.subscribe,
    mapping: resolveDynamicValues(mapping, guidCache),
    features: fixture.features ?? {}
  }
}
