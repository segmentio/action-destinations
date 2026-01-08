import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Track Event',
  description: 'Send Segment track events to Moengage.',
  platform: 'web',
  fields: {

  },
  perform: ({_client}) => {
    

    // code which calls the moengage web SDK to send data to Moengage
  }
}

export default action
