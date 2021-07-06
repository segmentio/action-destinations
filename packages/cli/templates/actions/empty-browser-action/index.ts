import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: '{{name}}',
  description: '{{description}}',
  fields: {},
  perform: (_client) => {
    // Invoke Partner SDK here
  }
}

export default action
