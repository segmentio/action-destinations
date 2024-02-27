import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Sprig } from '../types'

const action: BrowserActionDefinition<Settings, Sprig, Payload> = {
  title: 'Track Event',
  description: 'Track event to potentially filter user studies (microsurveys) later, or trigger a study now.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event != "Signed Out"',
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
    userId: {
      type: 'string',
      required: false,
      description: 'Unique identifier for the user',
      label: 'User ID',
      default: {
        '@path': '$.userId'
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
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Object containing the properties of the event',
      label: 'Event Properties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (Sprig, event) => {
    const payload = event.payload
    if (!payload || typeof payload !== 'object' || !payload.name) {
      console.warn('[Sprig] received invalid payload (expected name to be present); skipping trackEvent', payload)
      return
    }

    const sprigIdentifyAndTrackPayload: {
      eventName: string
      userId?: string
      anonymousId?: string
      properties?: { [key: string]: unknown }
    } = {
      eventName: payload.name
    }
    if (payload.userId) {
      sprigIdentifyAndTrackPayload.userId = payload.userId
    }

    if (payload.anonymousId) {
      sprigIdentifyAndTrackPayload.anonymousId = payload.anonymousId
    }

    if (payload.properties) {
      sprigIdentifyAndTrackPayload.properties = payload.properties
    }

    Sprig('identifyAndTrack', sprigIdentifyAndTrackPayload)
  }
}

export default action
