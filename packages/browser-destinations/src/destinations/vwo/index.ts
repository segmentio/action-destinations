import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import type { VWO } from './types'
import { initScript } from './init-script'
import { defaultValues } from '@segment/actions-core'

import trackEvent from './trackEvent'
import identifyUser from './identifyUser'

declare global {
  interface Window {
    VWO: VWO
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, VWO> = {
  name: 'VWO Web Mode (Actions)',
  slug: 'actions-vwo-web',
  mode: 'device',
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields)
    }
  ],
  settings: {
    // Add any Segment destination settings required here
    vwoAccountId: {
      description: 'Your VWO account ID, used for fetching your VWO async smart code.',
      label: 'VWO Account ID',
      type: 'number',
      required: true
    },
    settingsTolerance: {
      description:
        'The maximum amount of time (in milliseconds) to wait for test settings before VWO will simply display your original page.',
      label: 'Settings Tolerance',
      type: 'number',
      default: 2000
    },
    libraryTolerance: {
      description:
        'The maximum amount of time (in milliseconds) to wait for VWO’s full library to be downloaded before simply displaying your original page.',
      label: 'Library Tolerance',
      type: 'number',
      default: 2500
    },
    useExistingJquery: {
      description:
        'If your page already includes JQuery, you can set this to “true”. Otherwise, VWO will include JQuery onto the page for you. VWO needs JQuery on the page to function correctly. ',
      label: 'Use Existing JQuery',
      type: 'boolean',
      default: false
    }
  },

  initialize: async ({ settings }, deps) => {
    initScript({
      vwoAccountId: settings.vwoAccountId,
      settingsTolerance: settings.settingsTolerance,
      libraryTolerance: settings.libraryTolerance,
      useExistingJquery: settings.useExistingJquery
    })
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'VWO'), 100)
    return window.VWO
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
