import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../../lib/browser-destinations'
import { browserDestination } from '../../../runtime/shim'
import { PlayerZero } from './types'

import identifyUser from './identifyUser'

import trackEvent from './trackEvent'

declare global {
  interface Window {
    playerzero: PlayerZero
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, PlayerZero> = {
  name: 'PlayerZero Web',
  slug: 'actions-playerzero-web',
  mode: 'device',

  settings: {
    // Add any Segment destination settings required here
    projectId: {
      label: 'PlayerZero Project ID',
      description:
        'The Project ID where you want to send data. You can find this ID on the [Project Data Collection](https://go.playerzero.app/setting/data) page.',
      type: 'string',
      required: true
    }
  },

  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields)
    }
  ],

  initialize: async ({ settings }, deps) => {
    await deps.loadScript(`https://go.playerzero.app/record/${settings.projectId}`)
    // initialize client code here
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'playerzero'), 250)
    return window.playerzero
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
