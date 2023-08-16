import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identifyUser from './identifyUser'
import trackEvent from './trackEvent'
import identifyUserV2 from './identifyUserV2'
import trackEventV2 from './trackEventV2'
import { listOperationsRequestParams, deleteUserRequestParams } from './request-params'

const destination: DestinationDefinition<Settings> = {
  name: 'Fullstory Cloud Mode (Actions)',
  slug: 'actions-fullstory-cloud',
  mode: 'cloud',
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
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: '[FullStory API key](https://help.fullstory.com/hc/en-us/articles/360052021773-Managing-API-Keys)',
        type: 'password',
        required: true
      }
    },

    testAuthentication: (request, { settings }) => {
      const { url, options } = listOperationsRequestParams(settings)
      return request(url, options)
    }
  },

  onDelete: async (request, { settings, payload }) => {
    if (!payload.userId) {
      throw new PayloadValidationError('User Id is required for user deletion.')
    }
    const { url, options } = deleteUserRequestParams(settings, payload.userId)
    return request(url, options)
  },

  actions: {
    trackEvent,
    identifyUser,
    trackEventV2,
    identifyUserV2
  }
}

export default destination
