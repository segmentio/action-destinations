import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields, currency, value, status} from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Complete Registration',
  description: 'Track a Complete Registration event to Facebook Conversions API. Trigger this when a registration form is completed.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Signed Up"',
  fields: {
    ...optionsFields, 
    currency,
    value: {
      ...value, 
      default: { '@path': '$.properties.value' }
    },
    status,
    ...commonFields
  },
  perform: (client, { payload, settings }) => {
    const { pixelId } = settings
    const { custom_data, currency, value} = payload
    const options = buildOptions(payload)
    client('trackSingle', pixelId, 'CompleteRegistration', { currency, value, status, ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action