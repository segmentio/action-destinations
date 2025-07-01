import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Schedule',
  description: 'Track a Schedule event to Facebook Conversions API. Trigger this when a person books an appointment to visit one of your locations.',
  platform: 'web',
  fields: {
    ...optionsFields, 
    ...commonFields
  },
  perform: (client, { payload, settings }) => {
    const { pixelId } = settings
    const { custom_data } = payload
    const options = buildOptions(payload)
    client('trackSingle', pixelId, 'Schedule', { ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action