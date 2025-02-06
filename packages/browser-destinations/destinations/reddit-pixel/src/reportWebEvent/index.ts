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
    rdt.track = 'track'
    console.log('tracking type', payload.tracking_type)
    console.log('rdt.track', rdt.track)

    rdt(rdt.track, payload.tracking_type)
  }
}

export default action
