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
  slug: 'actions-userpilot-web',
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
    },
    endpoint: {
      label: 'The API endpoint the SDK would connect to',
      description:
        'By default, Userpilot would use a service discovery mechanism to determine the API endpoint to connect to. If you are using a proxy or a firewall, you can specify the API endpoint here.',
      required: false,
      type: 'string'
    },
    shouldSegmentLoadSDK: {
      label: 'Segment Loads Userpilot JS',
      description:
        'By default, Segment will load the Userpilot JS snippet onto the page. If you are already loading the Userpilot JS onto the page then disable this setting and Segment will detect the Userpilot JS on the page',
      required: true,
      type: 'boolean',
      default: true
    }
  },
  initialize: async ({ settings }, deps) => {
    const shouldLoadSDK = settings.shouldSegmentLoadSDK ?? true

    if (shouldLoadSDK) {
      window.userpilotSettings = {
        token: settings.token,
        endpoint: settings.endpoint,
        shouldSegmentLoadSDK: shouldLoadSDK
      }

      await deps.loadScript('//js.userpilot.io/sdk/latest.js')
      await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'userpilot'), 100)
    } else {
      await deps.resolveWhen(() => window.userpilot !== undefined, 100)
    }
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
