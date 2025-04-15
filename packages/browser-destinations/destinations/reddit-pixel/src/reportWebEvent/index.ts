import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { tracking_type, conversion_id, event_metadata, user } from '../fields'
import { RedditPixel } from '../types'

const action: BrowserActionDefinition<Settings, RedditPixel, Payload> = {
  title: 'Reddit Pixel',
  description: 'Reddit Pixel to track pagevists, addtocarts, search, etc.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    tracking_type,
    conversion_id,
    event_metadata,
    user
  },
  perform: (rdt, { payload }) => {
    if (payload.tracking_type === 'PageVisit') {
      if (typeof rdt.page === 'function') {
        rdt.page()
      } else {
        console.error('rdt.page() is not available.')
      }
    } else if (payload.tracking_type) {
      if (typeof rdt.track === 'function') {
        rdt.track(payload.tracking_type, payload.event_metadata)
      } else {
        console.error('rdt.track() is not available.')
      }
    } else {
      console.error('No valid tracking type found.')
    }
  }
}

export default action
