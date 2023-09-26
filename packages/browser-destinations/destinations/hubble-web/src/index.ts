import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import { Hubble } from './types'
import { defaultValues } from '@segment/actions-core'

import track from './track'
import identify from './identify'

declare global {
  interface Window {
    Hubble: Hubble
  }
}

export const destination: BrowserDestinationDefinition<Settings, Hubble> = {
  name: 'Hubble (actions)',
  slug: 'hubble-web',
  mode: 'device',

  presets: [
    {
      name: 'Identify user',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Track event',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    }
  ],

  settings: {
    id: {
      description: 'id',
      label: 'id',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    await deps.loadScript(`https://sdk.hubble.team/api/sdk/${settings.id}`)
    await deps.resolveWhen(() => window.Hubble.initialized, 250)

    // eslint-disable-next-line  @typescript-eslint/no-unsafe-call
    window.Hubble.setSource('__segment__')
    return window.Hubble
  },

  actions: {
    track,
    identify
  }
}

export default browserDestination(destination)
