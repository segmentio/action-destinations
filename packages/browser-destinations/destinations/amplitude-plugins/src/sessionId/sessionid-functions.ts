/* eslint-disable @typescript-eslint/no-unsafe-call */
import { UniversalStorage } from '@segment/analytics-next'
import type { Payload } from './generated-types'
import { Analytics, Context } from '@segment/analytics-next'
import { DESTINATION_INTEGRATION_NAME } from '../constants'
    
export function enrichWithSessionId(context: Context, payload: Payload, analytics: Analytics): boolean {
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

    let isNewSession = false

    const newSession = newSessionId()
    const storage = analytics.storage
      ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        (analytics.storage as UniversalStorage<Record<string, number>>)
      : storageFallback

    const raw = storage.get('analytics_session_id')
    const updated = storage.get('analytics_session_id.last_access')

    const withInSessionLimit = withinSessionLimit(newSession, updated, payload.sessionLength)
    if (!withInSessionLimit && payload.triggerSessionEvents) {
      // end previous session
      endSession(analytics, payload.sessionEndEvent)
    }

    let id: number | null = raw
    if (stale(raw, updated, payload.sessionLength)) {
      isNewSession = true
      id = newSession
      storage.set('analytics_session_id', id)
      if (payload.triggerSessionEvents) startSession(analytics, payload.sessionStartEvent)
    } else {
      // we are storing the session id regardless, so it gets synced between different storage mediums
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- id can't be null because of stale check
      storage.set('analytics_session_id', id!)
    }

    storage.set('analytics_session_id.last_access', newSession)

    if (context.event.integrations?.All !== false || context.event.integrations[DESTINATION_INTEGRATION_NAME]) {
      context.updateEvent(`integrations.${DESTINATION_INTEGRATION_NAME}`, {})
      context.updateEvent(`integrations.${DESTINATION_INTEGRATION_NAME}.session_id`, id)
    }
    console.log('isNewSession', isNewSession)
    return isNewSession
}

function newSessionId(): number {
  return now()
}

function startSession(analytics: Analytics, eventName = 'session_started') {
  analytics
    .track(eventName, {})
    .then(() => true)
    .catch(() => true)
}

function endSession(analytics: Analytics, eventName = 'session_ended') {
  analytics
    .track(eventName, {})
    .then(() => true)
    .catch(() => true)
}

export const THIRTY_MINUTES = 30 * 60000

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