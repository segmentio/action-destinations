import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

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
  onDelete: async (request) => {
    return request(baseUrl + 'delete')
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
      partnerAction: 'sendData'
    }
  ],
  actions: {
    sendData: {
      title: 'Send Data',
      description: 'Send data to Blend AI for product usage insights',
      defaultSubscription: 'type = "identify" or type = "page" or type = "screen" or type = "track"',
      perform: (request, { rawData }) => {
        return request(baseUrl + 'sendData', {
          json: { rawData: rawData }
        })
      }
    }
  }
}

export default destination
