import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import Sabil from './types'

import attach from './attach'

declare global {
  interface Window {
    Sabil: Sabil
  }
}

export const destination: BrowserDestinationDefinition<Settings, Sabil> = {
  name: 'Sabil',
  slug: 'actions-sabil',
  mode: 'device',

  settings: {
    client_id: {
      description:
        'Your project API client ID. You can find it in your Sabil [dashboard](https://dashboard.sabil.io/api_keys)',
      label: 'Client ID',
      required: true,
      type: 'string'
    }
  },

  initialize: async (_options, deps) => {
    try {
      await deps.loadScript('https://cdn.sabil.io/global.js')
      await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'Sabil'), 100)
      return window.Sabil
    } catch (err) {
      throw new Error('Could not load the Sabil js package')
    }
  },

  actions: {
    attach
  }
}

export default browserDestination(destination)
