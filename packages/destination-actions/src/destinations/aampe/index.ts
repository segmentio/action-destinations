import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './sendEvent'
import upsertUserProfile from './upsertUserProfile'
import { SingaporeURL, GermanyURL, FranceURL } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Aampe (Actions)',
  slug: 'actions-aampe',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Aampe API Key',
        type: 'password',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Your data region',
        type: 'string',
        required: true,
        choices: [
          { label: 'Singapore', value: SingaporeURL },
          { label: 'Germany', value: GermanyURL },
          { label: 'France', value: FranceURL }
        ],
        default: SingaporeURL
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`
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
