import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { initialBoot, initScript } from './init-script'

import { Intercom } from './api'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import identifyCompany from './identifyCompany'
import { defaultValues } from '@segment/actions-core'

declare global {
  interface Window {
    Intercom: Intercom
  }
}

export const destination: BrowserDestinationDefinition<Settings, Intercom> = {
  name: 'Intercom Web (Actions)',
  slug: 'actions-intercom-web',
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
      subscribe: 'type = "identify" or type = "page"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    },
    {
      name: 'Identify Company',
      subscribe: 'type = "group"',
      partnerAction: 'identifyCompany',
      mapping: defaultValues(identifyCompany.fields),
      type: 'automatic'
    }
  ],
  settings: {
    appId: {
      description: 'The app_id of your Intercom app which will indicate where to store any data.',
      label: 'App ID',
      type: 'string',
      required: true
    },
    activator: {
      description:
        'By default, Intercom will inject their own inbox button onto the page, but you can choose to use your own custom button instead by providing a CSS selector, e.g. #my-button. You must have the "Show the Intercom Inbox" setting enabled for this to work. The default value is #IntercomDefaultWidget.',
      label: 'Custom Inbox Button Selector',
      type: 'string',
      required: false,
      default: '#IntercomDefaultWidget'
    },
    richLinkProperties: {
      description: 'A list of rich link property keys.',
      label: 'Rich Link Properties',
      type: 'string',
      multiple: true,
      required: false
    },
    apiBase: {
      description: 'The regional API to use for processing the data',
      label: 'Regional Data Hosting',
      type: 'string',
      choices: [
        {
          label: 'US',
          value: 'https://api-iam.intercom.io'
        },
        {
          label: 'EU',
          value: 'https://api-iam.eu.intercom.io'
        },
        {
          label: 'Australia',
          value: 'https://api-iam.au.intercom.io'
        }
      ],
      default: 'https://api-iam.intercom.io',
      required: false
    }
  },

  initialize: async ({ settings }, deps) => {
    //initialize Intercom
    initScript({ appId: settings.appId })
    const preloadedIntercom = window.Intercom
    initialBoot(settings.appId, { api_base: settings.apiBase })

    await deps.resolveWhen(() => window.Intercom !== preloadedIntercom, 100)

    window.Intercom.richLinkProperties = settings.richLinkProperties
    window.Intercom.appId = settings.appId
    window.Intercom.activator = settings.activator

    return window.Intercom
  },

  actions: {
    trackEvent,
    identifyUser,
    identifyCompany
  }
}

export default browserDestination(destination)
