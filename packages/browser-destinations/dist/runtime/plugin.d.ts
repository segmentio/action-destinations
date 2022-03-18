import type { Plugin } from '@segment/analytics-next'
import { BrowserDestinationDefinition, Subscription } from '../lib/browser-destinations'
export declare function generatePlugins<S, C>(
  def: BrowserDestinationDefinition<S, C>,
  settings: S,
  subscriptions: Subscription[]
): Plugin[]
