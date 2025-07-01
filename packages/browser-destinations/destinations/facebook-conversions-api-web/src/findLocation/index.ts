import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Find Location',
  description: 'Track a Find Location event to Facebook Conversions API. Trigger this when a person searches for a location of your store via a website or app, with an intention to visit the physical location.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Location Searched"',
  fields: {
    ...optionsFields, 
    ...commonFields
  },
  perform: (client, { payload, settings }) => {
    const { pixelId } = settings
    const { custom_data } = payload
    const options = buildOptions(payload)
    client('trackSingle', pixelId, 'FindLocation', { ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action