import type { BrowserDestinationDefinition, PluginFactory, Subscription } from './types'

export function browserDestination<S, C>(definition: BrowserDestinationDefinition<S, C>): PluginFactory {
  const factory = (async (settings: S & { subscriptions?: Subscription[] }) => {
    const plugin = await import(
      /* webpackChunkName: "actions-plugin" */
      /* webpackMode: "lazy-once" */
      './plugin'
    )
    return plugin.generatePlugins(definition, settings, settings.subscriptions || [])
  }) as unknown as PluginFactory

  factory.pluginName = definition.name

  return factory
}
