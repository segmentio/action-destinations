import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { UniversalStorage } from '@segment/analytics-next'
import {
  storageFallback,
  clickIdCookieName,
  clickIdIntegrationFieldName,
  rdtCookieName,
  rdtUUIDIntegrationFieldName
} from '../utils'

const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Reddit Browser Plugin',
  description: 'Enriches Segment payloads with data from the Reddit Pixel',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const rdtCookie: string | null = storage.get(rdtCookieName)
    const clickId: string | null = storage.get(clickIdCookieName)

    if (rdtCookie || clickId) {
      const integrationsData: Record<string, string> = {}
      if (clickId) {
        integrationsData[clickIdIntegrationFieldName] = clickId
      }
      if (rdtCookie) {
        integrationsData[rdtUUIDIntegrationFieldName] = rdtCookie
      }
      if (context.event.integrations?.All !== false || context.event.integrations['Reddit Conversions Api']) {
        context.updateEvent(`integrations.Reddit Conversions Api`, integrationsData)
      }
    }
    return
  }
}

export default action
