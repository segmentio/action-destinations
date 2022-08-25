import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

import trackCustomBehavioralEvent from './trackCustomBehavioralEvent'

import trackPageView from './trackPageView'

import upsertContact from './upsertContact'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Hubspot Web (Actions)',
  slug: 'actions-hubspot-web',
  mode: 'device',

  settings: {
    portalId: {
      description: 'The Hub ID of your Hubspot account.',
      label: 'Hub ID',
      type: 'string',
      required: true
    },
    loadFormsSdk: {
      description: 'Load the Hubspot forms SDK.',
      label: 'Load Forms SDK',
      type: 'boolean',
      required: false
    },
    enableEuropeanDataCenter: {
      description: 'Enable the European Data Center.',
      label: 'Enable European Data Center',
      type: 'boolean',
      required: false
    }
  },

  initialize: async ({ settings }, deps) => {
    await deps.loadScript('<path_to_partner_script>')
    // initialize client code here
  },

  actions: {
    trackCustomBehavioralEvent,
    trackPageView,
    upsertContact
  }
}

export default browserDestination(destination)
