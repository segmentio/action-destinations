import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { initialBoot, initScript } from './init-script'

import trackEvent from './trackEvent'
import { Intercom } from './api'

import update from './update'

declare global {
  interface Window {
    Intercom: Intercom
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, Intercom> = {
  name: 'Intercom (Actions)',
  slug: 'actions-intercom',
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
      required: false,
      label: 'Rich Link Properties',
      type: 'string',
      multiple: true,
      description: 'A list of Segment property names whose values include url and value keys'
    }
  },

  initialize: async ({ settings }, deps) => {
    window.Intercom.richLinkProperties = settings.richLinkProperties
    window.Intercom.appId = settings.appId

    initScript({ appId: settings.appId })
    initialBoot(settings.appId)

    await deps.resolveWhen(() => window.Intercom.booted === true, 100)

    return window.Intercom
  },

  actions: {
    trackEvent,
    update
  }
}

export default browserDestination(destination)
