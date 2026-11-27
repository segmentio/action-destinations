import { Destination, MultiStatusResponse } from '@segment/actions-core'
import type { DecoratedResponse, JSONObject, RefreshAccessTokenResult, Result } from '@segment/actions-core'
import type { CTSuite } from '../types'
import type { CTAdapter, CTExchange, CTInvocation, CTObservation, CTObservedError } from './types'

function toExchange(response: DecoratedResponse): CTExchange {
  return {
    method: response.request?.method ?? String(response.options?.method ?? ''),
    url: response.request?.url ?? response.url,
    status: response.status,
    body: response.data ?? response.content
  }
}

// Mirrors integrations' createActionDestination send(): HTTP errors take the response status as
// their code, and Ajv / ValidationError become PAYLOAD_VALIDATION_FAILED, which is not retried (400).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toObservedError(err: any): CTObservedError {
  const isValidation = err?.name === 'AggregateAjvError' || err?.name === 'ValidationError'
  const status: number | undefined = err?.response?.status ?? err?.status ?? (isValidation ? 400 : undefined)
  const type = isValidation ? 'PAYLOAD_VALIDATION_FAILED' : err?.code ?? (status ? String(status) : err?.name)
  return { type: String(type ?? 'UNKNOWN'), message: String(err?.message ?? err), status }
}

/**
 * Runs a fixture through the destination definition in this process, via the same
 * `onEvent` / `onBatch` entry points integrations calls, with the subscription in settings.
 */
export class InProcessAdapter implements CTAdapter {
  readonly name = 'in-process'

  async run(invocation: CTInvocation, suite: CTSuite): Promise<CTObservation> {
    // A fresh Destination per run, so `responses` holds only this fixture's exchanges. It is built
    // from a copy that records what performBatch returned and whether a token refresh failed;
    // patching the shared definition would leak into suites running at the same time.
    let returnedMultiStatus: boolean | undefined
    let refreshFailed: boolean | undefined
    let definition = suite.definition
    const actionDefinition = definition.actions[invocation.action]
    const performBatch = actionDefinition?.performBatch
    if (performBatch) {
      definition = {
        ...definition,
        actions: {
          ...definition.actions,
          [invocation.action]: {
            ...actionDefinition,
            performBatch: async (...args: Parameters<typeof performBatch>) => {
              const response = await performBatch(...args)
              returnedMultiStatus = response instanceof MultiStatusResponse
              return response
            }
          }
        }
      }
    }
    const authentication = definition.authentication
    if (authentication && 'refreshAccessToken' in authentication && authentication.refreshAccessToken) {
      // A union across oauth2 and oauth-managed, so typed loosely to forward its arguments.
      const refresh = authentication.refreshAccessToken as (...args: unknown[]) => Promise<RefreshAccessTokenResult>
      definition = {
        ...definition,
        authentication: {
          ...authentication,
          refreshAccessToken: async (...args: unknown[]) => {
            refreshFailed = true
            const tokens = await refresh(...args)
            refreshFailed = !tokens
            return tokens
          }
        }
      }
    }
    const destination = new Destination(definition)
    const settings = {
      ...invocation.settings,
      subscription: { subscribe: invocation.subscribe, partnerAction: invocation.action, mapping: invocation.mapping }
    } as unknown as JSONObject
    let refreshedTokens: RefreshAccessTokenResult | undefined
    const options = {
      features: invocation.features,
      onTokenRefresh: async (tokens: RefreshAccessTokenResult) => {
        refreshedTokens = tokens
      }
    }

    try {
      const results: Result[] =
        invocation.mode === 'single'
          ? await destination.onEvent(invocation.events[0], settings, options)
          : await destination.onBatch(invocation.events, settings, options)
      return {
        exchanges: destination.responses.map(toExchange),
        multistatus: results.find((result) => result.multistatus)?.multistatus,
        returnedMultiStatus,
        refreshedTokens
      }
    } catch (err) {
      return {
        exchanges: destination.responses.map(toExchange),
        error: toObservedError(err),
        refreshedTokens,
        refreshFailed
      }
    }
  }
}
