/* eslint-disable @typescript-eslint/no-unsafe-call */
import { UniversalStorage } from '@segment/analytics-next'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

function newSessionId(): number {
  return now()
}

function startSession() {
  window.analytics
    .track('session_start', {})
    .then(() => true)
    .catch(() => true)
}

function endSession() {
  window.analytics
    .track('session_end', {})
    .then(() => true)
    .catch(() => true)
}

function withinSessionLimit(newTimeStamp: number, updated: number | null): boolean {
  // This checks if the new timestamp is within 30 minutes of the last updated timestamp
  const deltaTime = newTimeStamp - (updated ?? 0)
  return deltaTime < 30 * 60 * 1000 // 30 minutes
}

function now(): number {
  return new Date().getTime()
}

const THIRTY_MINUTES = 30 * 60000

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
  hidden: true,
  defaultSubscription: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
  fields: {
    sessionLength: {
      label: 'Session Length',
      type: 'number',
      required: false,
      description: 'Time in milliseconds to be used before considering a session stale.'
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

    let id: number | null = raw
    if (stale(raw, updated, payload.sessionLength)) {
      id = newSession
      storage.set('analytics_session_id', id)
      startSession()
    } else {
      // we are storing the session id regardless, so it gets synced between different storage mediums
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- id can't be null because of stale check
      storage.set('analytics_session_id', id!)
    }

    const withInSessionLimit = withinSessionLimit(newSession, updated)
    if (!withInSessionLimit) {
      // end previous session
      endSession()
      // start new session
      startSession()
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
