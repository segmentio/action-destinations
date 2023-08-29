// Module: Page Load event code
// Version: 1.0
// Changes:
// - Initial Version (A.Sikri)
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Send to CDPResolution',
  description: 'Send page, track, or identify event data to CDP Resolution once per session.',
  defaultSubscription: 'type = "page" or type = "track" or type = "identify"',
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
    try {
      const cdpcookieset = getCookie('cdpresolutionset')
      const pid = '48a021d87720f17403d730658979d7f60e9cec91937e82072c66f611748dd47d'
      const userAnonymousId: string | null = String(event.payload.anonymousId)
      const baseUrl = event.settings.endpoint

      const partnerUserId = {
        client_id: event.settings.ClientIdentifier,
        visitor_id: userAnonymousId
      }
      const partnerUserIdStr = encodeURIComponent(JSON.stringify(partnerUserId))

      const endpointUrl = userAnonymousId
        ? `${baseUrl}?pid=${pid}&puid=${partnerUserIdStr}&anonymousId=${encodeURIComponent(userAnonymousId)}`
        : baseUrl

      if (cdpcookieset == '') {
        document.cookie = 'cdpresolutionset=true'
        void fetch(endpointUrl, { mode: 'no-cors' })
        return
      }
    } catch (e) {
      throw new Error('Failed at Page Load')
    }
  }
}

function getCookie(cname: string): string {
  const name = cname + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) == ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}

export default action
