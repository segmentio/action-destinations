import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { Sprig } from './types'
import aliasUser from './aliasUser'
import identifyUser from './identifyUser'
import trackEvent from './trackEvent'
import { defaultValues } from '@segment/actions-core'

declare global {
  interface Window {
    Sprig: Sprig
  }
}

export const destination: BrowserDestinationDefinition<Settings, Sprig> = {
  name: 'Sprig',
  slug: 'sprig-web',
  mode: 'device',

  presets: [
    {
      name: 'Alias User',
      subscribe: 'type = "alias"',
      partnerAction: 'aliasUser',
      mapping: defaultValues(aliasUser.fields)
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields)
    },
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
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
    trackEvent,
    identifyUser,
    aliasUser
  },

  initialize: async ({ settings }, deps) => {
    if (!window.Sprig || !window.Sprig.envId) {
      window.Sprig = function (...args) {
        S._queue && S._queue.push(args)
      }
      const S = window.Sprig
      S.envId = settings.envId
      S._queue = []
      await deps.loadScript(`https://cdn.sprig.com/shim.js?id=${S.envId}`)
    }

    return window.Sprig
  }
}

export default browserDestination(destination)
