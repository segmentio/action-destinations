import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import type { StackAdaptSDK } from './types'
declare global {
  interface Window {
    saq: StackAdaptSDK
  }
}
export declare const destination: BrowserDestinationDefinition<Settings, StackAdaptSDK>
declare const _default: (
  settings: Settings & {
    subscriptions?: import('../../lib/browser-destinations').Subscription[] | undefined
  }
) => Promise<import('@segment/analytics-next').Plugin[]>
export default _default
