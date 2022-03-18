import type { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
export declare const trackPageDefaultSubscription = 'type = "page"'
export declare const trackPageFields: Record<string, InputField>
declare const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload>
export default action
