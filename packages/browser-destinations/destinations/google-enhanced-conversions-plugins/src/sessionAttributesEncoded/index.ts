import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { storageFallback } from '../utils'
import { STORAGE_LOCATION, INTEGRATION_FIELD_NAME, DESTINATION_NAME } from '../constants'
import { UniversalStorage } from '@segment/analytics-next'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Session Attributes Encoded Enrichment Plugin',
  description: 'Enriches Segment payloads with Session Attributes Encoded values from the page URL.',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const sessionAttributesEncoded: string | null = storage.get(STORAGE_LOCATION)

    if (sessionAttributesEncoded) {
      const integrationsData: Record<string, string> = {}
      integrationsData[INTEGRATION_FIELD_NAME] = sessionAttributesEncoded
      if (context.event.integrations?.All !== false || context.event.integrations[DESTINATION_NAME]) {
        context.updateEvent(`integrations.${DESTINATION_NAME}`, integrationsData)
      }
    }

    return
  }
}

export default action
