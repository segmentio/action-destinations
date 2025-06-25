import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { eventID, currency, value } from '../fields'
import type { FBClient } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Lead',
  description: 'Track a Lead event to Facebook Conversions API.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Signed Up"',
  fields: {
    eventID,
    currency,
    value
  },
  perform: (client, { payload, settings }) => {
    const { pixelId } = settings
    const { currency, value, eventID } = payload
    const options = eventID ? { eventID } : undefined 
    client('trackSingle',pixelId, 'Lead', { currency, value }, options)
  }
}

export default action
