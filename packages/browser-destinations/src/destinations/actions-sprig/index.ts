import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

interface Sprig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]): any // TODO revisit
  envId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _queue?: any[]
}
declare global {
  interface Window {
    Sprig: Sprig
    UserLeap: Sprig
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Sprig',
  slug: 'actions-sprig',
  mode: 'device',

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

  initialize: async ({ settings }, deps) => {
    if (!window.Sprig || !window.Sprig.envId) {
      window.Sprig = function (...args) {
        S._queue && S._queue.push(args)
      }
      const S = window.Sprig
      S.envId = settings.envId
      S._queue = []
      window.UserLeap = S
      await deps.loadScript(`https://cdn.sprig.com/shim.js?id=${S.envId}`)
    }

    return window.Sprig
  },

  actions: {}
}

export default browserDestination(destination)
