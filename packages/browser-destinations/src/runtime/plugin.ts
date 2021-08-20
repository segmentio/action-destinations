import type { Analytics, Context, Plugin } from '@segment/analytics-next'
import type { JSONObject } from '@segment/actions-core'
import { transform } from '@segment/actions-core/mapping-kit'
import { parseFql, validate } from '@segment/destination-subscriptions'
import { ActionInput, BrowserDestinationDefinition, Subscription } from '../lib/browser-destinations'
import { loadScript } from './load-script'
import { resolveWhen } from './resolve-when'

type MaybePromise<T> = T | Promise<T>

export function generatePlugins<S, C>(
  def: BrowserDestinationDefinition<S, C>,
  settings: S,
  subscriptions: Subscription[]
): Plugin[] {
  let hasInitialized = false
  let client: C
  let analytics: Analytics

  const load: Plugin['load'] = async (_ctx, analyticsInstance) => {
    if (hasInitialized) {
      return
    }

    analytics = analyticsInstance
    client = await def.initialize?.({ settings, analytics }, { loadScript, resolveWhen })
    hasInitialized = true
  }

  return Object.entries(def.actions).reduce((acc, [key, action]) => {
    // Grab all the enabled subscriptions that invoke this action
    const actionSubscriptions = subscriptions.filter((s) => s.enabled && s.partnerAction === key)
    if (actionSubscriptions.length === 0) return acc

    async function evaluate(ctx: Context): Promise<Context> {
      const invocations: Array<MaybePromise<unknown>> = []

      for (const sub of actionSubscriptions) {
        const isSubscribed = validate(parseFql(sub.subscribe), ctx.event)
        if (!isSubscribed) continue

        const mapping = (sub.mapping ?? {}) as JSONObject
        const payload = transform(mapping, ctx.event as unknown as JSONObject)

        const input: ActionInput<S, unknown> = {
          payload,
          mapping,
          settings,
          analytics,
          context: ctx
        }

        invocations.push(action.perform(client, input))
      }

      await Promise.all(invocations)
      // TODO: some sort of error handling
      return ctx
    }

    const plugin = {
      name: `${def.name} ${key}`,
      type: action.lifecycleHook ?? 'destination',
      version: '0.1.0',
      ready: () => Promise.resolve(),

      isLoaded: () => hasInitialized,
      load,

      track: evaluate,
      page: evaluate,
      alias: evaluate,
      identify: evaluate,
      group: evaluate
    }

    acc.push(plugin)
    return acc
  }, [] as Plugin[])
}
