import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import type { FakeClient } from './types'
import { defaultValues } from '@segment/actions-core'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import trackEvent from './trackEvent'

// An example device-mode destination used for testing/demonstration. It does not talk to any
// real API — `initialize` returns a small in-memory client that logs events to the console.
export const destination: BrowserDestinationDefinition<Settings, FakeClient> = {
  name: 'Fake Destination (Web)',
  slug: 'actions-fake-destination-web',
  description: 'An example browser (device-mode) destination used for demonstration and testing.',
  mode: 'device',
  settings: {
    apiKey: {
      type: 'string',
      label: 'API Key',
      description: 'The API key used to authenticate with Fake Destination.',
      required: true
    },
    endpoint: {
      type: 'string',
      label: 'Endpoint',
      description: 'The base URL events would be sent to. Defaults to the US endpoint.',
      required: false,
      default: 'https://api.fake-destination.example.com'
    }
  },

  initialize: async ({ settings }) => {
    const client: FakeClient = {
      apiKey: settings.apiKey,
      endpoint: settings.endpoint ?? 'https://api.fake-destination.example.com',
      track: (event, properties) => {
        // No real network call — this is a fake destination.
        console.log(`[fake-destination-web] track "${event}"`, properties ?? {})
      }
    }

    return client
  },

  actions: {
    trackEvent
  },

  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    }
  ]
}

export default browserDestination(destination)
