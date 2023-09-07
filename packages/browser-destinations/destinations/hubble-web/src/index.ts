import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import { Hubble, Methods } from './types'
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
      mapping: defaultValues(identify.fields)
    },
    {
      name: 'Track event',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields)
    }
  ],

  settings: {
    appID: {
      description: 'appID',
      label: 'appID',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    if (!window.Hubble) {
      const methods = ['identify', 'track']
      window.Hubble = {
        id: settings.appID,
        _queue: [],
        initialized: false
      }

      const queued = (method: keyof Methods) => {
        return (...args: unknown[]) => {
          if (window.Hubble._queue) {
            // eslint-disable-next-line  @typescript-eslint/no-unsafe-call
            window.Hubble._queue.push(() => {
              window.Hubble[method]?.(args)
            })
          }
        }
      }

      methods.forEach((method) => {
        window.Hubble[method as keyof Methods] = queued(method as keyof Methods)
      })

      await deps.loadScript(`https://cdn.hubble.team/sdk/hubble.js`)
      await deps.resolveWhen(() => window.Hubble && window.Hubble.initialized, 500)

      // eslint-disable-next-line  @typescript-eslint/no-unsafe-call
      window.Hubble?._emitter?.setSource('__segment__')
    }

    return window.Hubble
  },

  actions: {
    track,
    identify
  }
}

export default browserDestination(destination)
