import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatPhone, handleArrayInput } from '../formatter'
import { TikTokPixel } from '../types'
import { commonFields } from '../common_fields'
import { identifyCommonFields } from './pii_common_fields'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, TikTokPixel, Payload> = {
  title: 'Identify',
  description: '',
  platform: 'web',
  fields: {
    ...commonFields,
    ...identifyCommonFields
  },
  perform: (ttq, { payload }) => {
    if (payload.email || payload.phone_number || payload.external_id) {
      ttq.identify({
        email: handleArrayInput(payload.email),
        phone_number: formatPhone(handleArrayInput(payload.phone_number)),
        external_id: handleArrayInput(payload.external_id),
        first_name: '',
        last_name: '',
        city: '',
        state: '',
        country: '',
        zip_code: ''
      })
    }
  }
}

export default action
