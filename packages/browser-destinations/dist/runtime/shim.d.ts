import type { BrowserDestinationDefinition, Subscription } from '../lib/browser-destinations'
export declare function browserDestination<S, C>(
  definition: BrowserDestinationDefinition<S, C>
): (
  settings: S & {
    subscriptions?: Subscription[]
  }
) => Promise<import('@segment/analytics-next').Plugin[]>
