import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { Settings } from './generated-types'
import { Iterate, IterateApi, IterateSettings } from './types'
import { defaultValues } from '@segment/actions-core'

import trackEvent from './trackEvent'
import identifyUser from './identifyUser'

// Declare global to access your client
declare global {
  interface Window {
    Iterate: Iterate
    iterateSettings: IterateSettings
    IterateObjectName: string
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, Iterate> = {
  name: 'Iterate Web (Actions)',
  slug: 'actions-iterate',
  mode: 'device',
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
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
    // Add any Segment destination settings required here
    apiKey: {
      label: 'Embed API Key',
      description: 'The Embed API Key for your account. You can find this on your settings pages.',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    // initialize settings
    window.iterateSettings = {
      apiKey: settings.apiKey,
      installOnLoad: false
    }
    window.IterateObjectName = 'Iterate'

    // Initialize placeholder Iterate command
    const iteratePlaceholder = <IterateApi>function (...args) {
      iteratePlaceholder.command(args)
    }
    iteratePlaceholder.loaded = false
    iteratePlaceholder.q = []
    iteratePlaceholder.command = function (args: unknown[]) {
      iteratePlaceholder.q.push(args)
    }
    window.Iterate = iteratePlaceholder

    await deps.loadScript('https://platform.iteratehq.com/loader.js')
    await deps.resolveWhen(() => !Object.prototype.hasOwnProperty.call(window.Iterate, 'loaded'), 100)

    return window.Iterate
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
