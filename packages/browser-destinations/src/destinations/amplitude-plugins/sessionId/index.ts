import { UniversalStorage } from '@segment/analytics-next'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

function newSessionId(): number {
  return now()
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
  console.log(now(), accessedAt, '***')
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
      ? (analytics.storage as UniversalStorage<Record<string, number>>)
      : storageFallback

    const raw = storage.get('analytics_session_id')
    const updated = storage.get('analytics_session_id.last_access')

    let id: number | null = raw
    if (stale(raw, updated, payload.sessionLength)) {
      id = newSession
      storage.set('analytics_session_id', id)
    } else {
      storage.set('analytics_session_id', id as number)
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
