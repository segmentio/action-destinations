/* eslint-disable @typescript-eslint/no-unsafe-call */
import { UniversalStorage } from '@segment/analytics-next'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { v4 as uuidv4 } from '@lukeed/uuid'

function newMsclk(): string {
  return uuidv4()
}

function now(): number {
  return new Date().getTime()
}

const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000

function stale(id: string | null, updated: number | null, length: number = NINETY_DAYS): id is null {
  if (id === null || updated === null) {
    return true
  }

  const accessedAt = updated

  if (now() - accessedAt >= length) {
    return true
  }

  return false
}

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Msclick Id',
  description: 'Generates a MSCLK ID and attaches it to every Amplitude browser based event.',
  platform: 'web',
  fields: {
    sessionLength: {
      label: 'Session Length',
      type: 'number',
      description: 'The length of the session in days.',
      default: 90
    }
  },
  lifecycleHook: 'enrichment',
  perform: (_, { context, payload, analytics }) => {
    const storageFallback = {
      get: (key: string) => {
        const data = window.localStorage.getItem(key)
        return data === null ? null : data
      },
      set: (key: string, value: string | number) => {
        return window.localStorage.setItem(key, value.toString())
      }
    }

    const storage = analytics.storage
      ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        (analytics.storage as UniversalStorage<Record<string, string>>)
      : storageFallback

    const raw = storage.get('analytics_msclk_id')
    const updatedRaw = storage.get('analytics_msclk_id.last_access')
    const updated = updatedRaw !== null ? Number(updatedRaw) : null

    let id: string | null = raw
    const sessionLength = payload.sessionLength ? payload.sessionLength * 24 * 60 * 60 * 1000 : NINETY_DAYS
    if (stale(raw, updated, sessionLength)) {
      id = newMsclk()
      storage.set('analytics_msclk_id', id)
    } else {
      // we are storing the session id regardless, so it gets synced between different storage mediums
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- id can't be null because of stale check
      storage.set('analytics_msclk_id', id!)
    }

    storage.set('analytics_msclk_id.last_access', now().toString())

    if (context.event.integrations?.All !== false || context.event.integrations['MS Bing CAPI']) {
      context.updateEvent('integrations.MS Bing CAPI', {})
      context.updateEvent('integrations.MS Bing CAPI.msclk_id', id)
    }

    return
  }
}

export default action
