import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identifyUser from './identifyUser'
import { listOperationsRequestParams, deleteUserRequestParams } from './request-params'
import { dataRegions } from './data-regions'

const destination: DestinationDefinition<Settings> = {
  name: 'Fullstory (Actions)',
  slug: 'actions-fullstory',
  mode: 'cloud',
  presets: [
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields)
    }
  ],
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: '[FullStory API key](https://help.fullstory.com/hc/en-us/articles/360052021773-Managing-API-Keys)',
        type: 'password',
        required: true
      },
      region: {
        label: 'Data Region',
        description: 'The region where your FullStory organization is provisioned.',
        type: 'string',
        format: 'text',
        choices: dataRegions,
        default: 'north_america',
        required: true
      }
    },

    testAuthentication: (request, { settings }) => {
      const { url, options } = listOperationsRequestParams(settings)
      return request(url, options)
    }
  },

  onDelete: async (request, { settings, payload }) => {
    const { url, options } = deleteUserRequestParams(settings, payload.userId)
    return request(url, options)
  },

  actions: {
    identifyUser
  }
}

export default destination
