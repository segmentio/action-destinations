import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { Wingify } from './types'
import { initScript } from './init-script'
import { defaultValues } from '@segment/actions-core'

import trackEvent from './trackEvent'
import identifyUser from './identifyUser'

declare global {
  interface Window {
    Wingify: Wingify
  }
}

export const destination: BrowserDestinationDefinition<Settings, Wingify> = {
  name: 'Wingify Web Mode (Actions)',
  slug: 'actions-wingify-web',
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
    wingifyAccountId: {
      description: 'Your Wingify account ID, used for fetching your Wingify async smart code.',
      label: 'Wingify Account ID',
      type: 'number',
      required: true
    },
    settingsTolerance: {
      description:
        'The maximum amount of time (in milliseconds) to wait for test settings before Wingify will simply display your original page.',
      label: 'Settings Tolerance',
      type: 'number',
      default: 2000
    },
    addSmartcode: {
      description:
        'When enabled, Segment will load the Wingify SmartCode onto the webpage. When disabled, you will have to manually add SmartCode to your webpage. The setting is enabled by default, however we recommended manually adding SmartCode to the webpage to avoid flicker issues.',
      label: 'Add Asynchronous SmartCode',
      type: 'boolean',
      default: true
    }
  },

  initialize: async ({ settings }, deps) => {
    if (settings.addSmartcode != false) {
      initScript({
        wingifyAccountId: settings.wingifyAccountId,
        settingsTolerance: settings.settingsTolerance
      })
    }
    window.Wingify = window.Wingify || []
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'Wingify'), 100)
    return window.Wingify
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
