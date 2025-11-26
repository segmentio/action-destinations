/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enrichWithSessionId, THIRTY_MINUTES } from './sessionid-functions'
import { enrichWithAutocaptureAttribution } from './autocapture-attribution-functions'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Session and Autocapture Attribution Plugin',
  description: 'Enriches events with session IDs and autocapture attribution data for Amplitude.',
  platform: 'web',
  defaultSubscription: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
  fields: {
    sessionLength: {
      label: 'Session Length',
      type: 'number',
      required: false,
      description: 'Time in milliseconds to be used before considering a session stale.',
      default: THIRTY_MINUTES
    },
    triggerSessionEvents: {
      label: 'Allow Session Tracking',
      type: 'boolean',
      default: false,
      required: false,
      description:
        "if set to true, 'Session Started' and 'Session Ended' events will be triggered from the user's browser. These events will be forwarded to all connected Destinations."
    },
    sessionStartEvent: {
      label: 'Session Start Event',
      type: 'string',
      default: 'session_started',
      required: false,
      description: 'The event name to use for the session start event.',
      depends_on: {
        conditions: [
          {
            fieldKey: 'triggerSessionEvents',
            operator: 'is',
            value: true
          }
        ]
      }
    },
    sessionEndEvent: {
      label: 'Session End Event',
      type: 'string',
      default: 'session_ended',
      required: false,
      description: 'The event name to use for the session end event.',
      depends_on: {
        conditions: [
          {
            fieldKey: 'triggerSessionEvents',
            operator: 'is',
            value: true
          }
        ]
      }
    },
    enableAutocaptureAttribution: {
      label: 'Enable Autocapture Attribution',
      type: 'boolean',
      default: false,
      required: false,
      description: 'If enabled, attribution details will be captured from the URL and attached to every Amplitude browser based event.'
    },
    excludeReferrers: {
      label: 'Exclude Referrers',
      description: 'A list of hostnames to ignore when capturing attribution data. If the current page referrer matches any of these hostnames, no attribution data will be captured from the URL.',
      type: 'string',
      required: false,
      multiple: true,
      depends_on: {
        conditions: [
          {
            fieldKey: 'enableAutocaptureAttribution',
            operator: 'is',
            value: true
          }
        ]
      }
    }
  },
  lifecycleHook: 'enrichment',
  perform: (_, { context, payload, analytics }) => {
    const { enableAutocaptureAttribution } = payload
    const isNewSession = enrichWithSessionId(context, payload, analytics)
    if(enableAutocaptureAttribution){
        enrichWithAutocaptureAttribution(context, payload, analytics, isNewSession)
    }
  }
}

export default action