import { defaultValues } from '@segment/actions-core'
import type { JSONObject, RefreshAccessTokenResult } from '@segment/actions-core'
import type { E2EInvocation } from './adapters/types'
import { resolveDynamicValues, resolveSettings } from './resolve'
import type { E2EFixture, E2EHookValues, E2ESuite } from './types'

export interface E2EInvocationState {
  /** The suite's and fixture's `before` values, for '$before:<key>'. */
  values?: E2EHookValues
  /** Tokens refreshed earlier in the run, written over `settings.oauth`. */
  tokens?: RefreshAccessTokenResult
}

/** Core's updateOAuthSettings, which it doesn't export, on a copy. */
export function withRefreshedTokens(
  settings: Record<string, unknown>,
  tokens?: RefreshAccessTokenResult
): Record<string, unknown> {
  const oauth = settings.oauth
  if (!tokens || !oauth || typeof oauth !== 'object') return settings
  return {
    ...settings,
    oauth: {
      ...oauth,
      access_token: tokens.accessToken,
      ...(tokens.refreshToken ? { refresh_token: tokens.refreshToken } : {})
    }
  }
}

/**
 * Build the adapter-neutral input for one fixture attempt. The mapping is the action's field
 * defaults overlaid with the fixture's, because a stored subscription (what Centrifuge sends)
 * already carries the defaults. One guid cache spans events and mapping, so '$guid:<name>' agrees.
 */
export function buildInvocation(
  suite: E2ESuite,
  fixture: E2EFixture,
  env: NodeJS.ProcessEnv,
  state: E2EInvocationState = {}
): E2EInvocation {
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
    events: resolveDynamicValues(events, guidCache, state.values),
    settings: withRefreshedTokens(resolveSettings(suite.config.settings, env), state.tokens),
    subscribe: fixture.subscribe,
    mapping: resolveDynamicValues(mapping, guidCache, state.values),
    features: fixture.features ?? {}
  }
}
