import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
export declare const browserTrackCustomEventFields: Record<string, import('@segment/actions-core').InputField>
declare const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload>
export default action
