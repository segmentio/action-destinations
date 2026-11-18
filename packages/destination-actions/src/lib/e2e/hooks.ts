import { createRequestClient, getAuthData } from '@segment/actions-core'
import type { ExecuteInput, JSONObject } from '@segment/actions-core'
import type { E2EHookContext, E2ESuite } from './types'

/**
 * The context a suite's or fixture's hook gets: resolved settings, and a request client built the
 * way core builds an action's, from the destination's extendRequest. It does not refresh OAuth tokens.
 */
export function hookContext(suite: E2ESuite, settings: Record<string, unknown>, runId: string): E2EHookContext {
  const { subscription: _subscription, oauth: _oauth, ...destinationSettings } = settings
  const input = {
    settings: destinationSettings,
    payload: undefined,
    auth: getAuthData(settings as JSONObject)
  } as ExecuteInput<unknown, undefined>
  const options = suite.definition.extendRequest?.(input) ?? {}
  return { settings, request: createRequestClient(options), runId }
}
