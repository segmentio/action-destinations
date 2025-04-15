import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { tracking_type, conversion_id, event_metadata, user, products, data_processing_options } from '../fields'
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
    user,
    products,
    data_processing_options
  },
  perform: (rdt, { payload, settings }) => {
    // if (payload.tracking_type === 'PageVisit') {
    //   // Added track function
    //   if (payload.event_metadata) {
    //     if (payload.event_metadata?.device_type?.toLowerCase() === 'ios') {
    //       payload.event_metadata.idfa = payload.event_metadata.advertising_id
    //     } else {
    //       payload.event_metadata.aaid = payload.event_metadata.advertising_id
    //     }
    //     rdt('track', payload.tracking_type, combinedMetadata)
    //   } else {
    //     rdt('track', payload.tracking_type, combinedMetadata)
    //   }
    //   // ask about the below logic - it currently will always throws the error
    //   if (typeof rdt.page === 'function') {
    //     rdt.page()
    //   } else {
    //     console.error('rdt.page() is not available.')
    //   }
    // } else if (payload.tracking_type) {

    rdt.init(settings.pixel_id, {
      ...(settings.ldu && {
        dpm: payload.data_processing_options?.modes,
        dpcc: payload.data_processing_options?.country,
        dprc: payload.data_processing_options?.region
      })
    })
    if (payload.tracking_type && Object.keys(payload.tracking_type).length > 0) {
      if (payload.user) {
        if (payload.user?.device_type?.toLowerCase() === 'ios') {
          payload.user.idfa = payload.user.advertising_id
        } else {
          payload.user.aaid = payload.user.advertising_id
        }
      }
      const fullPayload = {
        ...payload.event_metadata,
        ...payload.user,
        products: payload.products,
        conversionId: payload.conversion_id
      }
      console.log('full payload', fullPayload)
      rdt.track(payload.tracking_type, fullPayload)

      // ask about the below logic
      if (typeof rdt.track === 'function') {
        console.log('in function in standard event')
        // rdt.track(payload.tracking_type, payload.event_metadata)
      } else {
        console.error('rdt.track() is not available.')
      }
    } else {
      console.error('No valid tracking type found.')
    }
  }
}

export default action
