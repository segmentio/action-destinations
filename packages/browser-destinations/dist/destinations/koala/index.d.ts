import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import type { KoalaSDK, Koala } from './types'
declare global {
  interface Window {
    ko: Koala
    KoalaSDK: KoalaSDK
  }
}
export declare const destination: BrowserDestinationDefinition<Settings, Koala>
declare const _default: (
  settings: Settings & {
    subscriptions?: import('../../lib/browser-destinations').Subscription[] | undefined
  }
) => Promise<import('@segment/analytics-next').Plugin[]>
export default _default
