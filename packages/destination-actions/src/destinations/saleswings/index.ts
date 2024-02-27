import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import { getAccountUrl } from './api'
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
      },
      environment: {
        label: 'Environment',
        description: 'SalesWings environment this destination is connected with.',
        type: 'string',
        choices: [
          { value: 'helium', label: 'Helium (live environment)' },
          { value: 'ozone', label: 'Ozone (test environment)' }
        ],
        required: true,
        default: 'helium'
      }
    },
    testAuthentication: async (request, { settings }) => {
      return request(getAccountUrl(settings.environment), {
        headers: { Authorization: `Bearer ${settings.apiKey}` }
      })
    }
  },

  presets: [
    {
      name: 'Submit Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'submitTrackEvent',
      mapping: defaultValues(submitTrackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Submit Identify Event',
      subscribe: 'type = "identify"',
      partnerAction: 'submitIdentifyEvent',
      mapping: defaultValues(submitIdentifyEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Submit Page Event',
      subscribe: 'type = "page"',
      partnerAction: 'submitPageEvent',
      mapping: defaultValues(submitPageEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Submit Screen Event',
      subscribe: 'type = "screen"',
      partnerAction: 'submitScreenEvent',
      mapping: defaultValues(submitScreenEvent.fields),
      type: 'automatic'
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
