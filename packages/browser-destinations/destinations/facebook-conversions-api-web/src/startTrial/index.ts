import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields, currency, predicted_ltv, value } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'StartTrial',
  description: 'Track a Start Trial event to Facebook Conversions API. Trigger this when a person starts a free trial of a product or service you offer.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Trial Started"',
  fields: {
    ...optionsFields, 
    currency: {
      ...currency, 
      required: true
    }, 
    predicted_ltv,
    value: {
      ...value, 
      required: true,
      default: { '@path': '$.properties.value' }
    },
    ...commonFields
  },
  perform: (client, { payload, settings }) => {
    const { pixelId } = settings
    const { custom_data, currency, value} = payload
    const options = buildOptions(payload)
    client('trackSingle', pixelId, 'StartTrial', { currency, predicted_ltv, value, ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action