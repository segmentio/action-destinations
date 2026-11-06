import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { UniversalStorage } from '@segment/analytics-next'
import {
  alartCookieName,
  alartIntegrationFieldName,
  alartQuerystringName,
  aleidCookieName,
  aleidQuerystringName,
  aleidIntegrationFieldName,
  axwrtCookieName,
  axwrtIntegrationFieldName,
  integrationName,
  storageAlartKey,
  storageAleidKey
} from '../constants'
import { getCookieValue, resolveClickId, storageFallback } from '../functions'

const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'AppLovin Browser Plugin',
  description: 'Enriches Segment payloads with identifiers from the AppLovin Pixel and AppLovin ad clicks.',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback

    const aleid = resolveClickId(storage, {
      queryName: aleidQuerystringName,
      cookieName: aleidCookieName,
      storageKey: storageAleidKey
    })
    const alart = resolveClickId(storage, {
      queryName: alartQuerystringName,
      cookieName: alartCookieName,
      storageKey: storageAlartKey
    })
    const axwrt = getCookieValue(axwrtCookieName)

    const integrationsData: Record<string, string> = {
      ...(aleid ? { [aleidIntegrationFieldName]: aleid } : {}),
      ...(alart ? { [alartIntegrationFieldName]: alart } : {}),
      ...(axwrt ? { [axwrtIntegrationFieldName]: axwrt } : {})
    }

    if (
      Object.keys(integrationsData).length > 0 &&
      (context.event.integrations?.All !== false || context.event.integrations[integrationName])
    ) {
      context.updateEvent(`integrations.${integrationName}`, integrationsData)
    }

    return
  }
}

export default action
