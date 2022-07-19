import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { initialBoot, initScript } from './init-script'

import trackEvent from './trackEvent'
import { Intercom } from './api'

import updateUser from './updateUser'

import updateCompany from './updateCompany'

declare global {
  interface Window {
    Intercom: Intercom
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, Intercom> = {
  name: 'Intercom Web (Actions)',
  slug: 'actions-intercom-web',
  mode: 'device',

  settings: {
    appId: {
      description: 'The app_id of your Intercom app which will indicate where to store any data.',
      label: 'App ID',
      type: 'string',
      required: true
    },
    activator: {
      description:
        'By default, Intercom will inject their own inbox button onto the page, but you can choose to use your own custom button instead by providing a CSS selector like: #my-button. Note: you must have enabled the Show the Intercom Inbox setting for this to work. The default value is #IntercomDefaultWidget',
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
    }
  },

  initialize: async ({ settings }, deps) => {
    //initialize Intercom
    initScript({ appId: settings.appId })
    initialBoot(settings.appId)

    await deps.resolveWhen(() => window.Intercom.booted === true, 100)

    //put settings on the Intercom object
    window.Intercom.richLinkProperties = settings.richLinkProperties
    window.Intercom.appId = settings.appId
    window.Intercom.activator = settings.activator

    return window.Intercom
  },

  actions: {
    trackEvent,
    updateUser,
    updateCompany
  }
}

export default browserDestination(destination)
