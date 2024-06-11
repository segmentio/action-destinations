import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { Evolv } from './types'
import { initScript } from './init-script'
import { defaultValues } from '@segment/actions-core'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'

declare global {
  interface Window {
    evolv: Evolv
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, Evolv> = {
  name: 'Evolv AI Web Mode (Actions)',
  slug: 'actions-evolv-ai-web',
  mode: 'device',
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    }
  ],
  settings: {
    // bindEvents: {
    //   description:
    //     'When a audience name is provided, this integration will also bind all event names to that audience as an array',
    //   label: 'Bind event names to Context attribute',
    //   type: 'string',
    //   default: ''
    // }
    // Add any Segment destination settings required here
  },

  initialize: async ({ settings }, deps) => {
    await deps.loadScript('https://media.evolv.ai/asset-manager/releases/latest/webloader.min.js', {
      'data-evolv-environment': '3c0066be9a'
    })
    initScript({
      bindEvents: settings.bindEvents
    })

    //   window.evolv = window.evolv || [];
    //   // window.evolv.settings = settings;
    //   await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'evolv'), 100);
    return window.evolv
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
