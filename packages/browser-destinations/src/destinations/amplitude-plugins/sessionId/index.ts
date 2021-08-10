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
  perform: (_, { context, payload }) => {
    const ls = window.localStorage
    const newSession = newSessionId()

    const raw = ls.getItem('analytics_session_id')
    const updated = ls.getItem('analytics_session_id.last_access')

    let id: number | string | null = raw
    if (stale(raw, updated, payload.sessionLength)) {
      id = newSession
      ls.setItem('analytics_session_id', id.toString())
    } else {
      id = parseInt(id as string, 10)
    }

    ls.setItem('analytics_session_id.last_access', newSession.toString())
    context.updateEvent('integrations.Amplitude.session_id', id)

    return
  }
}

export default action
