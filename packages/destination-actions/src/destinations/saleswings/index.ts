import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import { apiBaseUrl } from './api'
import type { Settings } from './generated-types'

import submitEvent from './submitEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Saleswings (Actions)',
  slug: 'actions-saleswings',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Segment.io API key for your SalesWings project.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const resp = await request(`${apiBaseUrl}/project/account`, {
        headers: { Authorization: `Bearer ${settings.apiKey}` }
      })
      return resp.status == 200
    }
  },

  presets: [
    {
      name: 'Submit Event',
      subscribe: 'type = "identify" or type = "track" or type = "screen" or type = "page"',
      partnerAction: 'submitEvent',
      mapping: defaultValues(submitEvent.fields)
    }
  ],

  actions: {
    submitEvent
  }
}

export default destination
