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
    // Add any Segment destination settings required here
    appId: {
      required: true,
      label: 'App ID',
      type: 'string',
      description: 'The app_id of your Intercom app which will indicate where to store any data'
    },
    richLinkProperties: {
      required: true,
      label: 'Rich Link Properties',
      type: 'string',
      multiple: true,
      description: 'A list of rich link property keys'
    }
  },

  initialize: async ({ settings }, deps) => {
    initScript({ appId: settings.appId })
    initialBoot(settings.appId)

    await deps.resolveWhen(() => window.Intercom.booted === true, 100)

    window.Intercom.richLinkProperties = settings.richLinkProperties
    window.Intercom.appId = settings.appId

    return window.Intercom
  },

  actions: {
    trackEvent,
    updateUser,
    updateCompany
  }
}

export default browserDestination(destination)
