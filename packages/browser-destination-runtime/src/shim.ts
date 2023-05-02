import type { BrowserDestinationDefinition, Subscription } from './types'

export function browserDestination<S, C>(definition: BrowserDestinationDefinition<S, C>) {
  return async (settings: S & { subscriptions?: Subscription[] }) => {
    const plugin = await import(
      /* webpackChunkName: "actions-plugin" */
      /* webpackMode: "lazy-once" */
      './plugin'
    )
    return plugin.generatePlugins(definition, settings, settings.subscriptions || [])
  }
}
