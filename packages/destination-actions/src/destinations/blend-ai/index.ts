import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendData from './sendData'
import trackEvents from './trackEvents'
import { defaultValues } from '@segment/actions-core'
import { BASE_URL } from './consts'

const destination: DestinationDefinition<Settings> = {
  name: 'Blend Ai',
  slug: 'actions-blend-ai',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'string',
        label: 'API Key',
        description: 'Blend API key - found on integration page.',
        required: true
      }
    },
    testAuthentication: (request) => request(BASE_URL + 'authenticate')
  },
  onDelete: async (request, { payload }) =>
    request(BASE_URL + 'delete', {
      method: 'post',
      json: { external_ids: [payload.userId] }
    }),
  extendRequest: ({ settings }) => {
    return {
      method: 'POST',
      headers: { Authorization: `Bearer ${settings.apiKey}` },
      json: { apiKey: settings.apiKey }
    }
  },
  presets: [
    {
      name: 'Send Data to Blend',
      subscribe: 'type = "identify" or type = "page" or type = "screen" or type = "track"',
      partnerAction: 'trackEvents',
      mapping: defaultValues(trackEvents.fields),
      type: 'automatic'
    }
  ],
  actions: {
    sendData,
    trackEvents
  }
}

export default destination
