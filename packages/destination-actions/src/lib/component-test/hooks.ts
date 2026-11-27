import { createRequestClient, Destination, getAuthData } from '@segment/actions-core'
import type { ExecuteInput, JSONObject, RefreshAccessTokenResult } from '@segment/actions-core'
import type { CTHookContext, CTSuite } from './types'

/**
 * The context a suite's or fixture's hook gets: resolved settings, and a request client built the
 * way core builds an action's, from the destination's extendRequest. It does not refresh OAuth tokens.
 */
export function hookContext(suite: CTSuite, settings: Record<string, unknown>, runId: string): CTHookContext {
  const { subscription: _subscription, oauth: _oauth, ...destinationSettings } = settings
  const input = {
    settings: destinationSettings,
    payload: undefined,
    auth: getAuthData(settings as JSONObject)
  } as ExecuteInput<unknown, undefined>
  const options = suite.definition.extendRequest?.(input) ?? {}
  return { settings, request: createRequestClient(options), runId }
}

/** Whether the suite or any fixture has a hook. */
export function hasHooks(suite: CTSuite): boolean {
  return Boolean(suite.before || suite.after || suite.fixtures.some((fixture) => fixture.before || fixture.after))
}

/**
 * Refresh OAuth tokens through the destination's refreshAccessToken, so hooks don't call the partner
 * with a stale stored access token. Undefined when the suite has no refresh token to use.
 */
export async function refreshForHooks(
  suite: CTSuite,
  settings: Record<string, unknown>
): Promise<RefreshAccessTokenResult | undefined> {
  const oauth = settings.oauth as Record<string, unknown> | undefined
  const authentication = suite.definition.authentication
  if (!oauth?.refresh_token || !authentication || !('refreshAccessToken' in authentication)) return undefined
  if (!authentication.refreshAccessToken) return undefined
  return new Destination(suite.definition).refreshTokenAndGetNewToken(settings as JSONObject)
}
