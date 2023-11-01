import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { Sprig } from './types'
import identifyUser from './identifyUser'
import signoutUser from './signoutUser'
import trackEvent from './trackEvent'
import updateUserId from './updateUserId'
import { defaultValues } from '@segment/actions-core'

declare global {
  interface Window {
    Sprig: Sprig
    UserLeap: Sprig
  }
}

export const destination: BrowserDestinationDefinition<Settings, Sprig> = {
  name: 'Sprig (Actions)',
  slug: 'sprig-web',
  mode: 'device',

  presets: [
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    },
    {
      name: 'Sign Out User',
      subscribe: 'type = "track" and event = "Signed Out"',
      partnerAction: 'signoutUser',
      mapping: defaultValues(signoutUser.fields),
      type: 'automatic'
    },
    {
      name: 'Track Event',
      subscribe: 'type = "track" and event != "Signed Out"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Update User ID',
      subscribe: 'type = "alias"',
      partnerAction: 'updateUserId',
      mapping: defaultValues(updateUserId.fields),
      type: 'automatic'
    }
  ],

  settings: {
    envId: {
      description: 'Your environment ID (production or development).',
      label: 'Environment ID',
      type: 'string',
      required: true
    },
    debugMode: {
      description: 'Enable debug mode for testing purposes.',
      label: 'Debug mode',
      type: 'boolean',
      required: false,
      default: false
    }
  },

  actions: {
    identifyUser,
    signoutUser,
    trackEvent,
    updateUserId
  },

  initialize: async ({ settings }, deps) => {
    if (!window.Sprig || !window.Sprig.envId) {
      window.Sprig = function (...args) {
        S._queue && S._queue.push(args)
      }
      const S = window.Sprig
      S.envId = settings.envId
      S.debugMode = !!settings.debugMode
      S._queue = []
      S._segment = 1
      window.UserLeap = S
      await deps.loadScript(`https://cdn.sprig.com/shim.js?id=${S.envId}`)
    }

    return window.Sprig
  }
}

export default browserDestination(destination)
