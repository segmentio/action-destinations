/* eslint-disable @typescript-eslint/no-unsafe-call */
import { UniversalStorage } from '@segment/analytics-next'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

function newSessionId(): number {
  return now()
}

function startSession(eventName = 'session_started') {
  window.analytics
    .track(eventName, {})
    .then(() => true)
    .catch(() => true)
}

function endSession(eventName = 'session_ended') {
  window.analytics
    .track(eventName, {})
    .then(() => true)
    .catch(() => true)
}

const THIRTY_MINUTES = 30 * 60000

function withinSessionLimit(newTimeStamp: number, updated: number | null, length: number = THIRTY_MINUTES): boolean {
  // This checks if the new timestamp is within the specified length of the last updated timestamp
  const deltaTime = newTimeStamp - (updated ?? 0)
  return deltaTime < length
}

function now(): number {
  return new Date().getTime()
}

function stale(id: number | null, updated: number | null, length: number = THIRTY_MINUTES): id is null {
  if (id === null || updated === null) {
    return true
  }

  const accessedAt = updated

  if (now() - accessedAt >= length) {
    return true
  }

  return false
}

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Session Plugin',
  description: 'Generates a Session ID and attaches it to every Amplitude browser based event.',
  platform: 'web',
  defaultSubscription: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
  fields: {
    sessionLength: {
      label: 'Session Length',
      type: 'number',
      required: false,
      description: 'Time in milliseconds to be used before considering a session stale.'
    },
    allowSessionTracking: {
      label: 'Allow Session Tracking',
      type: 'boolean',
      default: false,
      required: false,
      description:
        'Generate session start and session end events. This is useful for tracking user sessions. NOTE: This will generate a Segment track() event which will also get send to all Destinations connected to the JS Source'
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
            fieldKey: 'allowSessionTracking',
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
            fieldKey: 'allowSessionTracking',
            operator: 'is',
            value: true
          }
        ]
      }
    }
  },
  lifecycleHook: 'enrichment',
  perform: (_, { context, payload, analytics }) => {
    // TODO: this can be removed when storage layer in AJS is rolled out to all customers
    const storageFallback = {
      get: (key: string) => {
        const data = window.localStorage.getItem(key)
        return data === null ? null : parseInt(data, 10)
      },
      set: (key: string, value: number) => {
        return window.localStorage.setItem(key, value.toString())
      }
    }

    const newSession = newSessionId()
    const storage = analytics.storage
      ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        (analytics.storage as UniversalStorage<Record<string, number>>)
      : storageFallback

    const raw = storage.get('analytics_session_id')
    const updated = storage.get('analytics_session_id.last_access')

    const withInSessionLimit = withinSessionLimit(newSession, updated, payload.sessionLength)
    if (!withInSessionLimit && payload.allowSessionTracking) {
      // end previous session
      endSession(payload.sessionEndEvent)
    }

    let id: number | null = raw
    if (stale(raw, updated, payload.sessionLength)) {
      id = newSession
      storage.set('analytics_session_id', id)
      if (payload.allowSessionTracking) startSession(payload.sessionStartEvent)
    } else {
      // we are storing the session id regardless, so it gets synced between different storage mediums
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- id can't be null because of stale check
      storage.set('analytics_session_id', id!)
    }

    storage.set('analytics_session_id.last_access', newSession)

    if (context.event.integrations?.All !== false || context.event.integrations['Actions Amplitude']) {
      context.updateEvent('integrations.Actions Amplitude', {})
      context.updateEvent('integrations.Actions Amplitude.session_id', id)
    }

    return
  }
}

export default action
