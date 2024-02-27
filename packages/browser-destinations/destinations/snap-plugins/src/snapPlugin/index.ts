import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  storageSCIDCookieKey,
  storageClickIdKey,
  scidIntegrationFieldName,
  clickIdIntegrationFieldName,
  storageFallback
} from '../utils'
import { UniversalStorage } from '@segment/analytics-next'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Snap Browser Plugin',
  description: 'Enriches all Segment payloads with Snap click_id Querystring and _scid Cookie values',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback

    const scid: string | null = storage.get(storageSCIDCookieKey)

    const clickId: string | null = storage.get(storageClickIdKey)

    if (scid || clickId) {
      const integrationsData: Record<string, string> = {}
      if (clickId) {
        integrationsData[clickIdIntegrationFieldName] = clickId
      }
      if (scid) {
        integrationsData[scidIntegrationFieldName] = scid
      }
      if (context.event.integrations?.All !== false || context.event.integrations['Snap Conversions Api']) {
        context.updateEvent(`integrations.Snap Conversions Api`, integrationsData)
      }
    }

    return
  }
}

export default action
