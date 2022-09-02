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

function stale(id: string | null, updated: string | null, length: number = THIRTY_MINUTES): id is null {
  if (id === null || updated === null) {
    return true
  }

  const accessedAt = parseInt(updated, 10)
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
    const newSession = newSessionId()

    let getFromStorage = (_key: string): string | null => null
    let writeToStorage = (_key: string, _val: string | number): string | null => null

    if (analytics.user()['cookies']) {
      getFromStorage = analytics.user()['chainGet']
      writeToStorage = analytics.user()['trySet']
    }

    const raw = getFromStorage('analytics_session_id')
    const updated = getFromStorage('analytics_session_id.last_access')

    let id: number | string | null = raw
    if (stale(raw, updated, payload.sessionLength)) {
      id = newSession
      writeToStorage('analytics_session_id', id)
    } else {
      id = parseInt(id as string, 10)
    }

    writeToStorage('analytics_session_id.last_access', newSession)

    if (context.event.integrations?.All !== false || context.event.integrations['Actions Amplitude']) {
      context.updateEvent('integrations.Actions Amplitude', {})
      context.updateEvent('integrations.Actions Amplitude.session_id', id)
    }

    return
  }
}

export default action
