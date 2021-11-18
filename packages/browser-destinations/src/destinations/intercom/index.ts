import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { load, boot } from './init-script'
import trackEvent from './trackEvent'
import type { Intercom } from './api'

declare global {
  interface Window {
    Intercom: Intercom
  }
}

export const destination: BrowserDestinationDefinition<Settings, Intercom> = {
  name: 'Intercom (Actions)',
  slug: 'actions-intercom',
  mode: 'device',

  settings: {
    appId: {
      description: 'The app_id of your Intercom app which will indicate where to store any data',
      label: '',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, dependencies) => {
    const { appId } = settings

    load(appId)

    if (window.Intercom.booted !== true) {
      await dependencies.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'Intercom'), 100)
      boot(appId)
    }

    await dependencies.resolveWhen(() => window.Intercom.booted === true, 100)

    return window.Intercom
  },

  actions: {
    trackEvent
  }
}

export default browserDestination(destination)
