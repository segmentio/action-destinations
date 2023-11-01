import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendData from './sendData'
import { defaultValues } from '@segment/actions-core'

const baseUrl = 'https://segment-api.blnd.ai/'

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
    testAuthentication: (request) => {
      return request(baseUrl + 'authenticate')
    }
  },
  onDelete: async (request, { payload }) => {
    return request(baseUrl + 'delete', {
      method: 'post',
      json: {
        external_ids: [payload.userId]
      }
    })
  },
  extendRequest: ({ settings }) => {
    return {
      method: 'POST',
      json: { apiKey: settings.apiKey }
    }
  },
  presets: [
    {
      name: 'Send Data to Blend',
      subscribe: 'type = "identify" or type = "page" or type = "screen" or type = "track"',
      partnerAction: 'sendData',
      mapping: defaultValues(sendData.fields),
      type: 'automatic'
    }
  ],
  actions: {
    sendData
  }
}

export default destination
