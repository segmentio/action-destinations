import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatPhone, handleArrayInput, formatString, formatAddress } from '../formatter'
import { TikTokPixel } from '../types'
import { commonFields } from '../common_fields'

const action: BrowserActionDefinition<Settings, TikTokPixel, Payload> = {
  title: 'Report Web Event',
  description:
    'Report events directly to TikTok. Data shared can power TikTok solutions like dynamic product ads, custom targeting, campaign optimization and attribution.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    ...commonFields
  },
  perform: (ttq, { payload, settings }) => {
    if (payload.email || payload.phone_number || payload.external_id) {
      ttq.identify({
        email: handleArrayInput(payload.email),
        phone_number: formatPhone(handleArrayInput(payload.phone_number)),
        external_id: handleArrayInput(payload.external_id),
        first_name: formatString(payload.first_name),
        last_name: formatString(payload.last_name),
        city: formatAddress(payload.address?.city),
        state: formatAddress(payload.address?.state),
        country: formatAddress(payload.address?.country),
        zip_code: formatString(payload.address?.zip_code)
      })
    }

    ttq.instance(settings.pixelCode).track(
      payload.event,
      {
        contents: payload.contents ? payload.contents : [],
        content_type: payload.content_type ? payload.content_type : undefined,
        currency: payload.currency ? payload.currency : 'USD',
        value: payload.value || payload.value === 0 ? payload.value : undefined,
        query: payload.query ? payload.query : undefined,
        description: payload.description ? payload.description : undefined,
        order_id: payload.order_id ? payload.order_id : undefined,
        shop_id: payload.shop_id ? payload.shop_id : undefined
      },
      {
        event_id: payload.event_id ? payload.event_id : ''
      }
    )
  }
}

export default action
