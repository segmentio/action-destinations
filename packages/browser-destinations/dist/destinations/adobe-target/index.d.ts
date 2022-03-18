import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { Adobe } from './types'
declare global {
  interface Window {
    adobe: Adobe
    targetPageParams: Function
    pageParams: Object
  }
}
export declare const destination: BrowserDestinationDefinition<Settings, Adobe>
declare const _default: (
  settings: Settings & {
    subscriptions?: import('../../lib/browser-destinations').Subscription[] | undefined
  }
) => Promise<import('@segment/analytics-next').Plugin[]>
export default _default
