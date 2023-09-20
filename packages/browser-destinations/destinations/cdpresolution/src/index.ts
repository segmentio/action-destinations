// Module: Initialize code
// Version: 1.0
// Changes:
// - Initial Version (A.Sikri)
import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import sync from './sync'
import { DestinationDefinition, defaultValues } from '@segment/actions-core'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Sync identifier to CDP Resolution',
    subscribe: 'type = "page"',
    partnerAction: 'sync',
    mapping: defaultValues(sync.fields),
    type: 'automatic'
  }
]

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'CDP Resolution',
  slug: 'actions-cdpresolution',
  description: 'Sync Segment identifier to CDP Resolution',  
  mode: 'device',
  settings: {
    clientIdentifier: {
      label: 'Client Identifier',
      description: 'Client identifier provided by CDP Resolution [Hashed Account ID]',
      type: 'string',
      required: true
    },
    endpoint: {
      label: 'CDP Resolution Endpoint',
      description:
        'Identity resolution endpoint. [CDP Resolution documentation](https://www.cdpresolution.com/docs/)',
      type: 'string',
      format: 'uri',
      choices: [
        { label: 'CDPRes-Endpoint', value: 'https://a.usbrowserspeed.com/cs' }
      ],
      default: 'https://a.usbrowserspeed.com/cs',
      required: true
    }
  },
  initialize: async () => {
    return {}
  },
  presets,
  actions: {
    sync
  }
}

export default browserDestination(destination)
