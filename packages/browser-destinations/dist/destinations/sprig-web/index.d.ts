import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { Sprig } from './types'
declare global {
  interface Window {
    Sprig: Sprig
    UserLeap: Sprig
  }
}
export declare const destination: BrowserDestinationDefinition<Settings, Sprig>
declare const _default: (
  settings: Settings & {
    subscriptions?: import('../../lib/browser-destinations').Subscription[] | undefined
  }
) => Promise<import('@segment/analytics-next').Plugin[]>
export default _default
