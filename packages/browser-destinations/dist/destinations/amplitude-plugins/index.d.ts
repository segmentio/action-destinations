import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
export declare const destination: BrowserDestinationDefinition<Settings, {}>
declare const _default: (
  settings: Settings & {
    subscriptions?: import('../../lib/browser-destinations').Subscription[] | undefined
  }
) => Promise<import('@segment/analytics-next').Plugin[]>
export default _default
