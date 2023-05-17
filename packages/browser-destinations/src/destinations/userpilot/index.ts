import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import type { Userpilot } from './types'

import { browserDestination } from '../../runtime/shim'
import { defaultValues } from '@segment/actions-core'

import identifyUser from './identifyUser'
import trackEvent from './trackEvent'
import pageView from './pageView'

import identifyCompany from './identifyCompany'

declare global {
  interface Window {
    userpilot: Userpilot
    userpilotSettings: Settings
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, Userpilot> = {
  name: 'Userpilot Web (Actions)',
  slug: 'actions-userpilot',
  mode: 'device',
  presets: [
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields)
    },
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    },
    {
      name: 'Page View',
      subscribe: 'type = "page"',
      partnerAction: 'pageView',
      mapping: defaultValues(pageView.fields)
    }
  ],
  settings: {
    token: {
      label: 'App Token',
      description:
        'Your Userpilot app token, you can find it in the [Userpilot installation](https://run.userpilot.io/installation) dashboard.',
      required: true,
      type: 'string'
    }
  },

  initialize: async ({ settings }, deps) => {
    if (window.userpilot) {
      return window.userpilot
    }

    window.userpilotSettings = {
      token: settings.token
    }

    await deps.loadScript('//js.userpilot.io/sdk/latest.js')
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'userpilot'), 100)

    return window.userpilot
  },

  actions: {
    identifyUser,
    trackEvent,
    pageView,
    identifyCompany
  }
}

export default browserDestination(destination)
