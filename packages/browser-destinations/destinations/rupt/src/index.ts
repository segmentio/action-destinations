import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import attach from './attach'
import type { Settings } from './generated-types'
import Rupt from './types'

declare global {
  interface Window {
    Rupt: Rupt
  }
}

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Attach Device',
    subscribe: "type = 'page'",
    partnerAction: 'attach',
    mapping: defaultValues(attach.fields),
    type: 'automatic'
  }
]
export const destination: BrowserDestinationDefinition<Settings, Rupt> = {
  name: 'Rupt',
  slug: 'actions-rupt',
  mode: 'device',

  presets,

  settings: {
    client_id: {
      description: 'The API client id of your Rupt project.',
      label: 'Client ID',
      type: 'string',
      required: true
    },
    new_account_url: {
      description: 'A URL to redirect the user to if they want to stop account sharing and create a new account.',
      label: 'New Account URL',
      type: 'string',
      required: true
    },
    logout_url: {
      description:
        'A URL to redirect the user to if they choose to logout or if they are kicked out by a verified owner.',
      label: 'Logout URL',
      type: 'string',
      required: false
    },
    success_url: {
      description: 'A URL to redirect the user to if they are successfully verified and are within the device limit.',
      label: 'Success URL',
      type: 'string',
      required: false
    },
    suspended_url: {
      description: 'A URL to redirect the user to if they are suspended.',
      label: 'Suspended URL',
      type: 'string',
      required: false
    }
  },

  initialize: async (_, deps) => {
    try {
      await deps.loadScript('https://cdn.rupt.dev/js/rupt.js')
      await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'Rupt'), 500)
      return window.Rupt
    } catch (error) {
      throw new Error('Failed to load Rupt. ' + error)
    }
  },
  actions: {
    attach
  }
}

export default browserDestination(destination)
