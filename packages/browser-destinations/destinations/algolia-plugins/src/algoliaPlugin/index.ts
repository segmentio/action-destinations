import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { UniversalStorage } from '@segment/analytics-next'
import { storageFallback, storageQueryIdKey, queryIdIntegrationFieldName } from '../utils'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Algolia Browser Plugin',
  description: 'Enriches all Segment payloads with the Algolia query_id value',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback

    const query_id: string | null = storage.get(storageQueryIdKey)

    if (query_id && (context.event.integrations?.All !== false || context.event.integrations['Algolia Insights (Actions)'])) {
      const integrationsData: Record<string, string> = {}
      integrationsData[queryIdIntegrationFieldName] = query_id
      context.updateEvent(`integrations.Algolia Insights (Actions)`, integrationsData)
    }
  
    return
  }
}

export default action
