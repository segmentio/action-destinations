import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { tracking_type, conversion_id, event_metadata, user, products, data_processing_options } from '../fields'
import { RedditPixel } from '../types'
import { initPixel, trackCall } from '../utils'

const action: BrowserActionDefinition<Settings, RedditPixel, Payload> = {
  title: 'Reddit Pixel',
  description: 'Send Standard Pixel Events to Reddit. This includes pagevisits, addtocarts, search, etc.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    tracking_type,
    products,
    user,
    data_processing_options,
    event_metadata,
    conversion_id
  },
  perform: (rdt, { payload, settings }) => {
    initPixel(rdt, payload, settings)
    trackCall(rdt, payload)
  }
}

export default action
