import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getUser } from '../utils'
import { getAllProperties } from './utils'
import { TikTokPixel } from '../types'
import { track_fields } from './fields'
import { common_fields } from '../fields/common_fields'
import { travel_fields } from './travel_fields'
import { vehicle_fields } from './vehicle_fields'

const action: BrowserActionDefinition<Settings, TikTokPixel, Payload> = {
  title: 'Report Web Event',
  description:
    'Report events directly to TikTok. Data shared can power TikTok solutions like dynamic product ads, custom targeting, campaign optimization and attribution.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    ...track_fields,
    ...common_fields,
    vehicle_fields,
    travel_fields
  },
  perform: (ttq, { payload, settings }) => {
    if (payload.email || payload.phone_number || payload.external_id) {
      ttq.instance(settings.pixelCode).identify(getUser(payload))
    }

    ttq.instance(settings.pixelCode).track(
      payload.event, 
      getAllProperties(payload), 
      { 
        event_id: payload.event_id ? payload.event_id : ''
      }
    )
  }
}

export default action
