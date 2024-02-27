import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendEvent from './sendEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Metronome (Actions)',
  mode: 'cloud',
  slug: 'metronome-actions',

  authentication: {
    scheme: 'custom',
    fields: {
      apiToken: {
        type: 'string',
        label: 'API Token',
        description: 'Your Metronome API Token',
        required: true
      }
    },
    testAuthentication: async (request) => {
      const response = await request('https://api.metronome.com/v1/ingest', {
        method: 'post',
        json: [],
        throwHttpErrors: false
      })
      // An empty set of events will return a 400 response whereas a bad token will return a 403.
      if (response.status === 400) {
        return true
      }
      throw new Error('Invalid API Token')
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `Bearer ${settings.apiToken}` }
    }
  },
  actions: {
    sendEvent
  },
  presets: [
    {
      name: 'Send track events to Metronome',
      subscribe: 'type = "track"',
      partnerAction: 'sendEvent',
      mapping: defaultValues(sendEvent.fields),
      type: 'automatic'
    }
  ]
}

export default destination
