import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  storageRTIDKey,
  rtidIntegrationFieldName,
  storageFallback
} from '../utils'
import { UniversalStorage } from '@segment/analytics-next'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Rokt Browser Plugin',
  description: 'Enriches all Segment payloads with Rokt rtid Querystring value',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const rtid: string | null = storage.get(storageRTIDKey)
    if (rtid) {
      const integrationsData: Record<string, string> = {}
      integrationsData[rtidIntegrationFieldName] = rtid
      if (context.event.integrations?.All !== false || context.event.integrations['Rokt Conversions API']) {
        context.updateEvent(`integrations.Rokt Conversions API`, integrationsData)
      }
    }

    return
  }
}

export default action
