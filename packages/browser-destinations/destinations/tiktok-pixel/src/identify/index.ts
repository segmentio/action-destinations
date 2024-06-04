import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatPhone, handleArrayInput, formatString, formatAddress } from '../formatter'
import { TikTokPixel } from '../types'
import { commonFields } from '../common_fields'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, TikTokPixel, Payload> = {
  title: 'Identify',
  description: '',
  platform: 'web',
  fields: {
    ...commonFields
  },
  perform: (ttq, { payload }) => {
    if (payload.email || payload.phone_number || payload.external_id) {
      ttq.identify({
        email: handleArrayInput(payload.email),
        phone_number: formatPhone(handleArrayInput(payload.phone_number)),
        external_id: handleArrayInput(payload.external_id),
        first_name: formatString(payload.first_name),
        last_name: formatString(payload.last_name),
        city: payload.address ? formatAddress(payload.address.city) : '',
        state: payload.address ? formatAddress(payload.address.state) : '',
        country: payload.address ? formatAddress(payload.address.country) : '',
        zip_code: payload.address ? formatString(payload.address.zip_code) : ''
      })
    }
  }
}

export default action
