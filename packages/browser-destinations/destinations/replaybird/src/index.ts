import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { ReplayBird } from './types'
import { defaultValues } from '@segment/actions-core'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'

declare global {
  interface Window {
    replaybird: ReplayBird
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, ReplayBird> = {
  name: 'ReplayBird Web (Actions)',
  slug: 'actions-replaybird-web',
  mode: 'device',
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track" or type = "page"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    }
  ],
  settings: {
    apiKey: {
      description: 'The api key for replaybird',
      label: 'API Key',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    // initialize client code here
    await deps.loadScript(`https://cdn.replaybird.com/agent/latest/replaybird.js`)
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'replaybird'), 100)

    if (settings.apiKey) {
      window.replaybird.init(settings.apiKey, {})
      window.replaybird.apiKey = settings.apiKey
    }
    return window.replaybird
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
