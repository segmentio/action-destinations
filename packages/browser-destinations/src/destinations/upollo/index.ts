import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { UpolloClient } from './types'
import { defaultValues } from '@segment/actions-core'
import identifyUser from './identifyUser'

declare global {
  interface Window {
    upollo: {
      UpolloClient: typeof UpolloClient
    }
  }
}

export const destination: BrowserDestinationDefinition<Settings, UpolloClient> = {
  name: 'Upollo Web (Actions)',
  slug: 'actions-upollo',
  mode: 'device',

  presets: [
    {
      name: 'Identify',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields)
    }
  ],

  settings: {
    // Add any Segment destination settings required here
    apiKey: {
      description:
        'The api key of your Upollo project. Get it from the Upollo [dashboard](https://upollo.ai/dashboard)',
      label: 'API Key',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    try {
      await deps.loadScript('https://cdn.upollo.ai/web/0.2/bundle.min.js')

      await deps.resolveWhen(
        () => Object.prototype.hasOwnProperty.call(window, 'upollo'),
        500 // wait up to 500ms for the script to run.
      )

      return new window.upollo.UpolloClient(settings.apiKey)
    } catch (err) {
      throw new Error('Could not load the Upollo client ' + err)
    }
  },

  actions: {
    identifyUser
  }
}

export default browserDestination(destination)
