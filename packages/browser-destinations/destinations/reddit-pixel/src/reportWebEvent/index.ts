import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { tracking_type, conversion_id, event_metadata, user } from '../fields'
import { RedditPixel } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, RedditPixel, Payload> = {
  title: 'Reddit Pixel',
  description: '',
  platform: 'web',
  fields: {
    tracking_type,
    conversion_id,
    event_metadata,
    user
  },
  perform: (rdt, { payload }) => {
    console.log('tracking type:', payload.tracking_type)
    console.log('rdt.track:', rdt.track)

    // `rdt.track` is a string, which is incorrect.
    // If the Reddit Pixel SDK has an event-tracking function, use that instead.

    if (typeof rdt.page === 'function') {
      console.log('Calling Reddit Pixel tracking function')
      rdt.page() // Calling the available `page` method as an example.
    } else {
      console.error('rdt.page() is not defined.')
    }
  }
}

export default action
