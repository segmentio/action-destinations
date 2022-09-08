import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

import trackCustomBehavioralEvent from './trackCustomBehavioralEvent'

import trackPageView from './trackPageView'

import upsertContact from './upsertContact'
import type { Hubspot } from './types'
import { defaultValues } from '@segment/actions-core'

declare global {
  interface Window {
    _hsq: any
    hbspt: any
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, Hubspot> = {
  name: 'Hubspot Web (Actions)',
  slug: 'actions-hubspot-web',
  mode: 'device',
  presets: [
    {
      name: 'Track Custom Behavioral Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackCustomBehavioralEvent',
      mapping: defaultValues(trackCustomBehavioralEvent.fields)
    },
    {
      name: 'Update an Existing Contact or Create a New One',
      subscribe: 'type = "identify"',
      partnerAction: 'upsertContact',
      mapping: defaultValues(upsertContact.fields)
    },
    {
      name: 'Track Page View',
      subscribe: 'type = "page"',
      partnerAction: 'trackPageView',
      mapping: defaultValues(trackPageView.fields)
    }
  ],
  settings: {
    portalId: {
      description: 'The Hub ID of your Hubspot account.',
      label: 'Hub ID',
      type: 'string',
      required: true
    },
    enableEuropeanDataCenter: {
      description: 'Enable the European Data Center.',
      label: 'Enable European Data Center',
      type: 'boolean',
      required: false
    },
    flushIdentifyImmediately: {
      description: 'Fire a Page View immediately after an Identify to send the data to Hubspot.',
      label: 'Flush Identify calls immediately',
      type: 'boolean',
      required: false
    },
    formatCustomBehavioralEventNames: {
      description:
        'Format the event names for custom behavioral event automatically to standard Hubspot format (pe<HubID>_event_name).',
      label: 'Format Custom Behavioral Event Names',
      type: 'boolean',
      required: false,
      default: true
    },
    loadFormsSDK: {
      description: 'Load the Hubspot Forms SDK.',
      label: 'Load Forms SDK',
      type: 'boolean',
      required: false,
      default: false
    }
  },

  initialize: async ({ settings }, deps) => {
    const scriptPath = settings.enableEuropeanDataCenter
      ? `https://js-eu1.hs-scripts.com/${settings.portalId}.js`
      : `https://js.hs-scripts.com/${settings.portalId}.js`

    await deps.loadScript(scriptPath)
    if (settings.loadFormsSDK) {
      await deps.loadScript('https://js.hsforms.net/forms/v2.js')
    }
    await deps.resolveWhen(
      () =>
        !!(window._hsq && window._hsq.push !== Array.prototype.push) &&
        (!settings.loadFormsSDK || !!(window.hbspt && window.hbspt.forms)),
      100
    )
    return window._hsq
  },

  actions: {
    trackCustomBehavioralEvent,
    trackPageView,
    upsertContact
  }
}

export default browserDestination(destination)
