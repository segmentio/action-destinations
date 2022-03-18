import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import appboy from '@braze/web-sdk'
declare const action: BrowserActionDefinition<Settings, typeof appboy, Payload>
export default action
