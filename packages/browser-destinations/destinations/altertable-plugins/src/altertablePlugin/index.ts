import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { UniversalStorage } from '@segment/analytics-next'
import {
  deviceIdIntegrationFieldName,
  integrationName,
  sessionIdIntegrationFieldName,
  viewportIntegrationFieldName
} from '../constants'
import { getViewport, resolveDeviceId, resolveSessionId, storageFallback } from '../functions'

const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Altertable Browser Plugin',
  description:
    'Adds the Altertable session ID, device ID and viewport to every browser event. A new session starts after 30 minutes without events.',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback

    const sessionId = resolveSessionId(storage, Date.now())
    const deviceId = resolveDeviceId(storage)
    const viewport = getViewport()

    if (context.event.integrations?.All !== false || context.event.integrations[integrationName]) {
      const existing = context.event.integrations?.[integrationName]
      context.updateEvent(`integrations.${integrationName}`, {
        ...(existing && typeof existing === 'object' ? existing : {}),
        [sessionIdIntegrationFieldName]: sessionId,
        [deviceIdIntegrationFieldName]: deviceId,
        ...(viewport ? { [viewportIntegrationFieldName]: viewport } : {})
      })
    }

    return
  }
}

export default action
