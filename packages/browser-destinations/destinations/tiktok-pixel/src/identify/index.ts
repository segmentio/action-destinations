import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatPhone, handleArrayInput, formatString, formatAddress } from '../formatter'
import { TikTokPixel } from '../types'
import { commonFields } from '../common_fields'

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
  perform: (ttq, { payload }) => {
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
  }
}

export default action
