import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields, currency, value } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Lead',
  description: 'Track a Lead event to Facebook Conversions API.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Signed Up"',
  fields: {
    ...optionsFields, 
    currency,
    value,
    ...commonFields
  },
  perform: (client, { payload, settings }) => {
    const { pixelId } = settings
    const { custom_data, currency, value} = payload
    const options = buildOptions(payload)
    client('trackSingle', pixelId, 'Lead', { currency, value, ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action