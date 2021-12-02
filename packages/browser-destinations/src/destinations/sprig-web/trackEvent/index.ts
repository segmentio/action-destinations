import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Sprig } from '../types'

const action: BrowserActionDefinition<Settings, Sprig, Payload> = {
  title: 'Track Event',
  description: 'Track event to potentially filter user studies (microsurveys) later, or trigger a study now.',
  platform: 'web',
  fields: {
    name: {
      description: "The event name that will be shown on Sprig's dashboard",
      label: 'Event name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'Anonymous identifier for the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    }
  },
  perform: (Sprig, event) => {
    const payload = event.payload
    if (!payload) return

    if (payload.anonymousId) {
      Sprig('setPartnerAnonymousId', payload.anonymousId)
    }
    Sprig('track', payload.name)
  }
}

export default action
