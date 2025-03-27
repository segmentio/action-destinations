import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { BASE_API_URL } from './constants/api'

import identify from './identify'

import group from './group'

const destination: DestinationDefinition<Settings> = {
  name: 'Canny (Actions)',
  slug: 'actions-canny',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'You can find your API Key in the Segment Integration page in your admin settings.',
        type: 'string',
        required: true
      }
    },

    testAuthentication(request) {
      return request(`${BASE_API_URL}/validateAPIKey`, {
        method: 'post'
      })
    }
  },

  extendRequest({ settings }) {
    const auth = Buffer.from(settings.apiKey + ':').toString('base64')
    return {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    }
  },

  presets: [
    {
      name: 'Create or update a Company',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    },
    {
      name: 'Create or update a User',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    }
  ],

  actions: {
    identify,
    group
  }
}

export default destination
