import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { UniversalStorage } from '@segment/analytics-next'
import {
  integrationName,
  sessionExpirationTimeMs,
  sessionIdIntegrationFieldName,
  sessionIdPrefix,
  storageLastEventAtKey,
  storageSessionIdKey
} from '../constants'

interface SessionStorage {
  get: (key: string) => unknown
  set: (key: string, value: string) => unknown
}

const storageFallback: SessionStorage = {
  get: (key: string) => window.localStorage.getItem(key),
  set: (key: string, value: string) => window.localStorage.setItem(key, value)
}

function readStorage(storage: SessionStorage, key: string): unknown {
  try {
    return storage.get(key)
  } catch {
    return null
  }
}

function writeStorage(storage: SessionStorage, key: string, value: string): void {
  try {
    storage.set(key, value)
  } catch {
    return
  }
}

function generateSessionId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    try {
      return `${sessionIdPrefix}-${globalThis.crypto.randomUUID()}`
    } catch {
      // Fall back to Math.random() below
    }
  }
  return `${sessionIdPrefix}-${Math.random().toString(36).substring(2)}`
}

function shouldRenewSession(lastEventAt: unknown, now: Date): boolean {
  if (typeof lastEventAt !== 'string' || lastEventAt === '') {
    return true
  }
  const lastEventTime = new Date(lastEventAt).getTime()
  return Number.isNaN(lastEventTime) || now.getTime() - lastEventTime > sessionExpirationTimeMs
}

function resolveSessionId(storage: SessionStorage, now: Date): string {
  const storedId = readStorage(storage, storageSessionIdKey)
  const lastEventAt = readStorage(storage, storageLastEventAtKey)

  let sessionId: string
  if (typeof storedId === 'string' && storedId !== '' && !shouldRenewSession(lastEventAt, now)) {
    sessionId = storedId
  } else {
    sessionId = generateSessionId()
    writeStorage(storage, storageSessionIdKey, sessionId)
  }
  writeStorage(storage, storageLastEventAtKey, now.toISOString())

  return sessionId
}

const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Session Plugin',
  description:
    'Generates a session ID and attaches it to every Altertable browser event. A new session starts after 30 minutes without events.',
  platform: 'web',
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const sessionId = resolveSessionId(storage, new Date())

    if (context.event.integrations?.All !== false || context.event.integrations[integrationName]) {
      const existing = context.event.integrations?.[integrationName]
      context.updateEvent(`integrations.${integrationName}`, {
        ...(existing && typeof existing === 'object' ? existing : {}),
        [sessionIdIntegrationFieldName]: sessionId
      })
    }

    return
  }
}

export default action
