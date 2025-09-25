import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getUserObject } from '../utils'
import { TikTokPixel } from '../types'
import { commonFields } from '../reportWebEvent/fields/common_fields'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, TikTokPixel, Payload> = {
  title: 'Identify',
  description:
    'Use a Segment identify() call to sent PII data to TikTok Pixel. Note that the PII information will be sent with the next track() call.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    ...commonFields,
    phone_number: {
      ...commonFields.phone_number,
      default: { '@path': '$.traits.phone' }
    },
    email: {
      ...commonFields.email,
      default: { '@path': '$.traits.email' }
    },
    first_name: {
      ...commonFields.first_name,
      default: { '@path': '$.traits.first_name' }
    },
    last_name: {
      ...commonFields.last_name,
      default: { '@path': '$.traits.last_name' }
    },
    address: {
      ...commonFields.address,
      default: {
        city: { '@path': '$.traits.address.city' },
        country: { '@path': '$.traits.address.country' },
        zip_code: { '@path': '$.traits.address.postal_code' },
        state: { '@path': '$.traits.address.state' }
      }
    }
  },
  perform: (ttq, { payload, settings }) => {
    if (payload.email || payload.phone_number || payload.external_id) {
      ttq.instance(settings.pixelCode).identify(getUserObject(payload))
    }
  }
}

export default action
