import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './sendEvent'
import upsertUserProfile from './upsertUserProfile'

const destination: DestinationDefinition<Settings> = {
  name: 'Aampe',
  slug: 'actions-aampe',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Aampe API Key',
        type: 'string',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Your Aampe region.',
        type: 'string',
        required: true,
        choices: [
          { label: 'US', value: 'https://ingestion.api.aampe.com/v1/' }
        ],
        default: 'https://ingestion.api.aampe.com/v1/'
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        authorization: `Bearer ${settings.apiKey}`
      }
    }
  },
  actions: {
    sendEvent,
    upsertUserProfile
  },
  presets: [
    {
      name: 'Send Event',
      subscribe: 'type = "track" or type = "page" or type = "screen"',
      partnerAction: 'sendEvent',
      mapping: defaultValues(sendEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'upsertUserProfile',
      mapping: defaultValues(upsertUserProfile.fields),
      type: 'automatic'
    }
  ]
}

export default destination
