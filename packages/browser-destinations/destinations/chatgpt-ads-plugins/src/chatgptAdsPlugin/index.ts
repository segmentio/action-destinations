import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  storageOpprefKey,
  storageObrefKey,
  integrationName,
  opprefIntegrationFieldName,
  obrefIntegrationFieldName,
  storageFallback
} from '../utils'
import { UniversalStorage } from '@segment/analytics-next'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'ChatGPT Ads Browser Plugin',
  description:
    'Enriches Segment payloads with the ChatGPT Ads oppref querystring value and the __obref cookie value, so the ChatGPT Ads Conversions destination can send them. Segment does not check consent: you are responsible for loading this destination only when your measurement consent requirements allow reading the __obref cookie.',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback

    const oppref: string | null = storage.get(storageOpprefKey)
    const obref: string | null = storage.get(storageObrefKey)

    if (!oppref && !obref) {
      return
    }

    const integrations = context.event.integrations
    const existing = integrations?.[integrationName]

    if (existing === false || (integrations?.All === false && !existing)) {
      return
    }

    const current: Record<string, unknown> = typeof existing === 'object' && existing !== null ? existing : {}

    const additions: Record<string, string> = {
      ...(oppref && !current[opprefIntegrationFieldName] ? { [opprefIntegrationFieldName]: oppref } : {}),
      ...(obref && !current[obrefIntegrationFieldName] ? { [obrefIntegrationFieldName]: obref } : {})
    }

    if (Object.keys(additions).length > 0) {
      context.updateEvent(`integrations.${integrationName}`, { ...current, ...additions })
    }
  }
}

export default action
