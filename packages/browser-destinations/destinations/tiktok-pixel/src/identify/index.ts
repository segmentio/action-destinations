import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getUser } from '../utils'
import { TikTokPixel } from '../types'
import { common_fields } from '../reportWebEvent/fields/common_fields'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, TikTokPixel, Payload> = {
  title: 'Identify',
  description:
    'Use a Segment identify() call to sent PII data to TikTok Pixel. Note that the PII information will be sent with the next track() call.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    ...common_fields,
    phone_number: {
      ...common_fields.phone_number,
      default: { '@path': '$.traits.phone' }
    },
    email: {
      ...common_fields.email,
      default: { '@path': '$.traits.email' }
    },
    first_name: {
      ...common_fields.first_name,
      default: { '@path': '$.traits.first_name' }
    },
    last_name: {
      ...common_fields.last_name,
      default: { '@path': '$.traits.last_name' }
    },
    address: {
      ...common_fields.address,
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
      ttq.instance(settings.pixelCode).identify(getUser(payload))
    }
  }
}

export default action
