import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

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
      mapping: defaultValues(trackCustomBehavioralEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Upsert Contact',
      subscribe: 'type = "identify"',
      partnerAction: 'upsertContact',
      mapping: defaultValues(upsertContact.fields),
      type: 'automatic'
    },
    {
      name: 'Track Page View',
      subscribe: 'type = "page"',
      partnerAction: 'trackPageView',
      mapping: defaultValues(trackPageView.fields),
      type: 'automatic'
    }
  ],
  settings: {
    portalId: {
      description: 'The Hub ID of your HubSpot account.',
      label: 'Hub ID',
      type: 'string',
      required: true
    },
    enableEuropeanDataCenter: {
      description: 'Enable this option if you would like Segment to load the HubSpot SDK for EU data residency.',
      label: 'Enable the European Data Center SDK.',
      type: 'boolean',
      required: false
    },
    flushIdentifyImmediately: {
      description:
        'Enable this option to fire a `trackPageView` HubSpot event immediately after each Segment `identify` call to flush the data to HubSpot immediately.',
      label: 'Flush Identify Calls Immediately',
      type: 'boolean',
      required: false
    },
    formatCustomBehavioralEventNames: {
      description:
        'Format the event names for custom behavioral event automatically to standard HubSpot format (`pe<HubID>_event_name`).',
      label: 'Format Custom Behavioral Event Names',
      type: 'boolean',
      required: false,
      default: true
    },
    loadFormsSDK: {
      description:
        'Enable this option if you would like Segment to automatically load the HubSpot Forms SDK onto your site.',
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

    const formsScriptPath = settings.enableEuropeanDataCenter
      ? 'https://js-eu1.hsforms.net/forms/v2.js'
      : 'https://js.hsforms.net/forms/v2.js'

    await deps.loadScript(scriptPath)
    if (settings.loadFormsSDK) {
      await deps.loadScript(formsScriptPath)
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
