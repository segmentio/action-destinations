import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { UniversalStorage } from '@segment/analytics-next'
import { storageFallback, clickIdCookieName, clickIdIntegrationFieldName, CLOUD_INTEGRATION_NAME } from '../utils'

const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Nextdoor Browser Plugin',
  description: 'Enriches Segment payloads the Nextdoor Click ID',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const clickId: string | null = storage.get(clickIdCookieName)
    if (clickId) {
      const integrationsData: Record<string, string> = {}
      integrationsData[clickIdIntegrationFieldName] = clickId

      if (context.event.integrations?.All !== false || context.event.integrations[CLOUD_INTEGRATION_NAME]) {
        context.updateEvent(`integrations.${CLOUD_INTEGRATION_NAME}`, integrationsData)
      }
    }
    return
  }
}

export default action
