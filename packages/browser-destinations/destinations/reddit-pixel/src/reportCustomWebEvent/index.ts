import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { conversion_id, event_metadata, user, products, data_processing_options, custom_event_name } from '../fields'
import { RedditPixel } from '../types'
import { initPixel, trackCall } from '../utils'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, RedditPixel, Payload> = {
  title: 'Reddit Pixel - Custom Event',
  description: 'Reddit Pixel to track Custom Event Names that is not one of the Standard Reddit Pixel Events.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    conversion_id,
    event_metadata,
    user,
    products,
    data_processing_options,
    custom_event_name
  },
  perform: (rdt, { payload, settings }) => {
    initPixel(rdt, payload, settings)
    trackCall(rdt, payload)
  }
}

export default action
