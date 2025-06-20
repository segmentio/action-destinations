import type { Settings } from './generated-types'
import type { Payload as StandardEvent } from './reportWebEvent/generated-types'
import type { Payload as CustomEvent } from './reportCustomWebEvent/generated-types'
import { RedditPixel, EventMetadata } from './types'

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
  if (['PageVisit', 'ViewContent', 'Search'].includes((payload as StandardEvent)?.tracking_type)) {
    delete payload.event_metadata
  }

  const fullPayload: EventMetadata = {
    ...payload.event_metadata,
    products: payload.products ?? undefined,
    conversionId: payload.conversion_id ?? undefined,
    email: payload?.user?.email ?? undefined,
    externalId: payload?.user?.externalId ?? undefined,
    phoneNumber: payload?.user?.phoneNumber ?? undefined,
    aaid:
      payload?.user?.advertising_id && payload?.user?.device_type?.toLowerCase() === 'android'
        ? payload?.user?.advertising_id
        : undefined,
    idfa:
      payload?.user?.advertising_id && payload?.user?.device_type?.toLowerCase() === 'ios'
        ? payload?.user?.advertising_id
        : undefined,
    customEventName: (payload as CustomEvent).custom_event_name ?? undefined
  }

  rdt.track((payload as StandardEvent)?.tracking_type ?? 'Custom', fullPayload)
}
