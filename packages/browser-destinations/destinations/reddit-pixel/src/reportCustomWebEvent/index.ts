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

    // payload.tracking_type === 'Custom'
    // rdt.init(settings.pixel_id, {
    //   ...(settings.ldu && {
    //     dpm: 'LDU', // Currently "LDU" is the only value supported if the LDU toggle is enabled.
    //     dpcc: payload.data_processing_options?.country,
    //     dprc: payload.data_processing_options?.region
    //   })
    // })
    // if (payload.tracking_type === 'Custom' && payload.custom_event_name && Object.keys(payload.tracking_type).length > 0) {
    //   if (payload.user) {
    //     if (payload.user?.device_type?.toLowerCase() === 'ios') {
    //       payload.user.idfa = payload.user.advertising_id
    //     } else {
    //       payload.user.aaid = payload.user.advertising_id
    //     }
    //   }
    //   const fullPayload = {
    //     customEventName: payload?.custom_event_name,
    //     value: payload.event_metadata?.value,
    //     currency: payload.event_metadata?.currency,
    //     itemCount: payload.event_metadata?.itemCount,
    //     products: payload.products,
    //     conversionId: payload.conversion_id,
    //     ...payload.user,
    //   }
    //   console.log('full payload for Custom Event', fullPayload)
    //   rdt.track(payload.tracking_type, fullPayload)

    // } else {
    //   console.error('No valid tracking type found or No Custom Event Name passed.')
    // }
  }
}

export default action
