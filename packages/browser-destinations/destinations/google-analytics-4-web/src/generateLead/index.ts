import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { user_properties, params, user_id, currency, value } from '../ga4-properties'
import { updateUser } from '../ga4-functions'

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Generate Lead',
  description:
    'Log this event when a lead has been generated to understand the efficacy of your re-engagement campaigns.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    user_id: user_id,
    currency: currency,
    value: value,
    user_properties: user_properties,
    params: params
  },
  perform: (gtag, { payload }) => {
    updateUser(payload.user_id, payload.user_properties, gtag)

    gtag('event', 'generate_lead', {
      currency: payload.currency,
      value: payload.value,
      ...payload.params
    })
  }
}

export default action
