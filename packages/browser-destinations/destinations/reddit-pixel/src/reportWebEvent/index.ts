import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { tracking_type, conversion_id, event_metadata, user, products, data_processing_options } from '../fields'
import { RedditPixel } from '../types'
import { initPixel, trackCall } from '../utils'

const action: BrowserActionDefinition<Settings, RedditPixel, Payload> = {
  title: 'Reddit Pixel',
  description: 'Reddit Pixel to track pagevisits, addtocarts, search, etc.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    tracking_type,
    conversion_id,
    event_metadata,
    user,
    products,
    data_processing_options
  },
  perform: (rdt, { payload, settings }) => {
    initPixel(rdt, payload, settings)
    trackCall(rdt, payload)
    // rdt.init(settings.pixel_id, {
    //   ...(settings.ldu && {
    //     dpm: 'LDU', // Currently "LDU" is the only value supported if the LDU toggle is enabled.
    //     dpcc: payload.data_processing_options?.country,
    //     dprc: payload.data_processing_options?.region
    //   })
    // })
    // if (payload.tracking_type && Object.keys(payload.tracking_type).length > 0) {
    //   if (payload.user) {
    //     if (payload.user?.device_type?.toLowerCase() === 'ios') {
    //       payload.user.idfa = payload.user.advertising_id
    //     } else {
    //       payload.user.aaid = payload.user.advertising_id
    //     }
    //   }
    //   const fullPayload = {
    //     // value: payload.event_metadata?.value,
    //     // currency: payload.event_metadata?.currency,
    //     // itemCount: payload.event_metadata?.itemCount,
    //     ...payload.event_metadata,
    //     products: payload.products,
    //     conversionId: payload.conversion_id,
    //     ...payload.user,
    //   }
    //   console.log('full payload', fullPayload)
    //   rdt.track(payload.tracking_type, fullPayload)

    // } else {
    //   console.error('No valid tracking type found.')
    // }
  }
}

export default action
