// Module: Page Load event code
// Version: 1.0
// Changes:
// - Initial Version (A.Sikri)
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Page Load',
  description: '',
  defaultSubscription: 'type = "page"',
  platform: 'web',
  fields: {
    anonymousId: {
      label: 'Anonymous Id',
      description: 'The anonymous id of the user',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    }
  },
  perform: (_client, event) => {
    // Invoke Partner SDK here
    //console.log('inside cdpresolution pageload')
    try {
      const pid = '48a021d87720f17403d730658979d7f60e9cec91937e82072c66f611748dd47d'
      const userAnonymousId: string | null = String(event.payload.anonymousId)
      const baseUrl = event.settings.endpoint

      let partnerUserId = {
        "client_id": event.settings.ClientIdentifier,
        "visitor_id": userAnonymousId
      }
      let partnerUserIdStr = encodeURIComponent(JSON.stringify(partnerUserId));


      const endpointUrl = userAnonymousId
        ? `${baseUrl}?pid=${pid}&puid=${partnerUserIdStr}&anonymousId=${encodeURIComponent(userAnonymousId)}`
        : baseUrl;

      fetch(endpointUrl, { mode: 'no-cors' })
      return

    } catch (e) {
      throw new Error('Failed at Page Load')
    }
  }
}

export default action
