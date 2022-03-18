import type { FS } from './types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import type { Settings } from './generated-types'
declare global {
  interface Window {
    FS: FS
  }
}
export declare const segmentEventSource = 'segment-browser-actions'
export declare const destination: BrowserDestinationDefinition<Settings, FS>
declare const _default: (
  settings: Settings & {
    subscriptions?: import('../../lib/browser-destinations').Subscription[] | undefined
  }
) => Promise<import('@segment/analytics-next').Plugin[]>
export default _default
