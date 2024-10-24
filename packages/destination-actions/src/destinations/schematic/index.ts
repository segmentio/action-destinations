import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'

import identifyUser from './identifyUser'

const destination: DestinationDefinition<Settings> = {
  name: 'Schematic',
  slug: 'actions-schematic',
  mode: 'cloud',
  description: 'Send Segment events to Schematic to enrich/update user and company profiles.',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'string',
        label: 'API Key',
        description: 'Found on your settings page.',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`https://api.schematichq.com/environments`, {
        method: 'GET',
        headers: { 'X-Schematic-Api-Key': `${settings.apiKey}` }
      })
    }
  },

  actions: {
    trackEvent,
    identifyUser
  },
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
  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `Bearer ${settings.apiKey}` }
    }
  }
}

export default destination
