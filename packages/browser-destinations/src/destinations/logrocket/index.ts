import { LR } from './types'
import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import LogRocket from 'logrocket'
import track from './track'
import { defaultValues } from '@segment/actions-core'

declare global {
  interface Window {
    LogRocket: LR
  }
}
// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, LR> = {
  name: 'Logrocket',
  slug: 'actions-logrocket',
  mode: 'device',

  presets: [
    {
      name: 'Track',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields)
    }
  ],

  settings: {
    appID: {
      description: 'The LogRocket app ID.',
      label: 'LogRocket App',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings: { appID } }, deps) => {
    LogRocket.init(appID)
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, '_LRLogger'), 100)
    return LogRocket
  },

  actions: {
    track
  }
}

export default browserDestination(destination)
