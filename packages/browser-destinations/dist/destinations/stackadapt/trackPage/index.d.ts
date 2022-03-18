import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { StackAdaptSDK } from '../types'
import type { Payload } from './generated-types'
export declare const trackPageDefaultSubscription = 'type = "page"'
declare const action: BrowserActionDefinition<Settings, StackAdaptSDK, Payload>
export default action
