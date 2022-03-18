import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import type { Settings } from './generated-types'
import type { FriendbuyAPI } from './types'
declare global {
  interface Window {
    friendbuyAPI?: FriendbuyAPI
    friendbuyBaseHost?: string
  }
}
export declare const destination: BrowserDestinationDefinition<Settings, FriendbuyAPI>
declare const _default: (
  settings: Settings & {
    subscriptions?: import('../../lib/browser-destinations').Subscription[] | undefined
  }
) => Promise<import('@segment/analytics-next').Plugin[]>
export default _default
