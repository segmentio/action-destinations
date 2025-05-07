import type { Settings } from './generated-types'
import type { Payload as StandardEvent } from './reportWebEvent/generated-types'
import type { Payload as CustomEvent } from './reportCustomWebEvent/generated-types'
import { RedditPixel } from './types'

export function initPixel(rdt: RedditPixel, payload: StandardEvent | CustomEvent, settings: Settings) {
  rdt.init(settings.pixel_id, {
    ...(settings.ldu && {
      dpm: 'LDU', // Currently "LDU" is the only value supported if the LDU toggle is enabled.
      dpcc: payload.data_processing_options?.country,
      dprc: payload.data_processing_options?.region
    })
  })
}

export function trackCall(rdt: RedditPixel, payload: StandardEvent | CustomEvent) {
  const custom_event_name = (payload as CustomEvent).custom_event_name

  if (typeof custom_event_name === 'string' && custom_event_name.trim() !== '') {
    ;(payload as StandardEvent).tracking_type = 'Custom'
  }

  if ((payload as StandardEvent).tracking_type && Object.keys((payload as StandardEvent).tracking_type).length > 0) {
    if (payload.user) {
      if (payload.user?.device_type?.toLowerCase() === 'ios') {
        payload.user.idfa = payload.user.advertising_id
      } else {
        payload.user.aaid = payload.user.advertising_id
      }
    }
    const fullPayload = {
      ...payload.event_metadata,
      products: payload.products,
      conversionId: payload.conversion_id,
      ...payload.user,
      customEventName: custom_event_name
    }
    rdt.track((payload as StandardEvent).tracking_type, fullPayload)
  } else {
    console.error(' No valid tracking type found in the Reddit Pixel.')
  }
}
