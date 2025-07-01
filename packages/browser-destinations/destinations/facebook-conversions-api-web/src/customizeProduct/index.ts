import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'CustomizeProduct',
  description: 'Track a Customize Product event to Facebook Conversions API. Trigger this when a person customizes a product.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Product Customized"',
  fields: {
    ...optionsFields, 
    ...commonFields
  },
  perform: (client, { payload, settings }) => {
    const { pixelId } = settings
    const { custom_data } = payload
    const options = buildOptions(payload)
    client('trackSingle', pixelId, 'CustomizeProduct', { ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action