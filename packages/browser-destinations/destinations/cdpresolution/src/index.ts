// Module: Initialize code
// Version: 1.0
// Changes:
// - Initial Version (A.Sikri)
import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import pageLoad from './pageLoad'
import { DestinationDefinition, defaultValues } from '@segment/actions-core'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Page View',
    subscribe: 'type = "page"',
    partnerAction: 'pageLoad',
    mapping: defaultValues(pageLoad.fields),
    type: 'automatic'
  }
]

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Cdpresolution',
  slug: 'actions-cdpresolution',
  mode: 'device',

  settings: {
    // Add any Segment destination settings required here
    ClientIdentifier: {
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

  initialize: async ({ settings, analytics }, deps) => {
    //await deps.loadScript('<path_to_partner_script>')
    // initialize client code here
    const baseURL = settings.endpoint

  },

  presets,
  actions: {
    pageLoad
  }
}

export default browserDestination(destination)
