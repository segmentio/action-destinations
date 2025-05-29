import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getCookieValue } from '../utils'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Dub Browser Plugin',
  description: 'Enriches all Segment payloads with dub_id cookie value',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context }) => {
    const cookieName = 'dub_id'
    const cookieValue: string | null = getCookieValue(cookieName)

    if (cookieValue) {
      const integrationsData: Record<string, string> = {}
      integrationsData[cookieName] = cookieValue
      if (context.event.integrations?.All !== false || context.event.integrations['Dub (Actions)']) {
        context.updateEvent(`integrations.Dub (Actions)`, integrationsData)
      }
    }

    return
  }
}

export default action
