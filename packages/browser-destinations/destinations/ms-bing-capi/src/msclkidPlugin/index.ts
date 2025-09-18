import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { storageClickIdKey, clickIdIntegrationFieldName, storageFallback } from '../utils'
import { UniversalStorage } from '@segment/analytics-next'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Microsoft Bing msclkid Browser Plugin',
  description: 'Enriches all Segment payloads with the Microsoft Bing msclkid Querystring value',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const msclkid: string | null = storage.get(storageClickIdKey)
    const integrationsData: Record<string, string> = {}
    if (msclkid) {
      integrationsData[clickIdIntegrationFieldName] = msclkid
      if (context.event.integrations?.All !== false || context.event.integrations['Snap Conversions Api']) {
        context.updateEvent(`integrations.Microsoft Bing CAPI`, integrationsData)
      }
    }
    return
  }
}

export default action
