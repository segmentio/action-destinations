import type { BrowserDestinationDefinition, Subscription } from '../lib/browser-destinations'

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
