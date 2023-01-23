import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import { apiBaseUrl } from './api'
import type { Settings } from './generated-types'

import submitTrackEvent from './submitTrackEvent'
import submitIdentifyEvent from './submitIdentifyEvent'
import submitPageEvent from './submitPageEvent'
import submitScreenEvent from './submitScreenEvent'

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
      name: 'Submit Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'submitTrackEvent',
      mapping: defaultValues(submitTrackEvent.fields)
    },
    {
      name: 'Submit Identify Event',
      subscribe: 'type = "identify"',
      partnerAction: 'submitIdentifyEvent',
      mapping: defaultValues(submitIdentifyEvent.fields)
    },
    {
      name: 'Submit Page Event',
      subscribe: 'type = "page"',
      partnerAction: 'submitPageEvent',
      mapping: defaultValues(submitPageEvent.fields)
    },
    {
      name: 'Submit Screen Event',
      subscribe: 'type = "screen"',
      partnerAction: 'submitScreenEvent',
      mapping: defaultValues(submitScreenEvent.fields)
    }
  ],

  actions: {
    submitTrackEvent,
    submitIdentifyEvent,
    submitPageEvent,
    submitScreenEvent
  }
}

export default destination
