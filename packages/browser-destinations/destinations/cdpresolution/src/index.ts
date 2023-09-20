// Module: Initialize code
// Version: 1.0
// Changes:
// - Initial Version (A.Sikri)
import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import { CDPResolution } from './types'
import sync from './sync'

declare global {
  interface Window {
    cdpResolution: CDPResolution
  }
}

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Sync Anonymous ID',
    subscribe: 'type = "page" or type = "track" or type = "identify"',
    partnerAction: 'sync',
    mapping: defaultValues(sync.fields),
    type: 'automatic'
  }
]

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, CDPResolution> = {
  name: 'CDP Resolution',
  slug: 'actions-cdpresolution',
  mode: 'device',
  description: 'Sync Segment user identifier to CDP Resolution',
  settings: {
    // Add any Segment destination settings required here
    clientIdentifier: {
      label: 'Client Identifier',
      description: 'Client identifier provided by CDP Resolution [Hashed Account ID]',
      type: 'string',
      required: true
    },
    endpoint: {
      label: 'CDP Resolution Endpoint',
      description: 'Identity resolution endpoint. [CDP Resolution documentation](https://www.cdpresolution.com/docs/)',
      type: 'string',
      format: 'uri',
      choices: [{ label: 'CDPRes-Endpoint', value: 'https://a.usbrowserspeed.com/cs' }],
      default: 'https://a.usbrowserspeed.com/cs',
      required: true
    }
  },

  initialize: async () => {
    window.cdpResolution = {
      sync: (endpoint: string, clientIdentifier: string, anonymousId: string): void => {
        let cdpcookieset = ''
        const name = 'cdpresolutionset' + '='
        const ca = document.cookie.split(';')
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i]
          while (c.charAt(0) == ' ') {
            c = c.substring(1)
          }
          if (c.indexOf(name) == 0) {
            cdpcookieset = c.substring(name.length, c.length)
          }
        }

        const pid = '48a021d87720f17403d730658979d7f60e9cec91937e82072c66f611748dd47d'
        const userAnonymousId: string | null = String(anonymousId)
        const baseUrl = endpoint

        const partnerUserId = {
          client_id: clientIdentifier,
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
      }
    }

    return window.cdpResolution
  },

  presets,
  actions: {
    sync
  }
}

export default browserDestination(destination)
