import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import type appboy from '@braze/web-sdk'
declare global {
  interface Window {
    appboy: typeof appboy
  }
}
export declare const destination: BrowserDestinationDefinition<Settings, typeof appboy>
declare const _default: (
  settings: Settings & {
    subscriptions?: import('../../lib/browser-destinations').Subscription[] | undefined
  }
) => Promise<import('@segment/analytics-next').Plugin[]>
export default _default
