import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

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
      },
      // TODO: Figure out how to select traits from dropdown
      customFields: {
        label: 'Custom Fields',
        description: 'Segment traits to be imported as custom fields on the user',
        type: 'string'
      }
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
      name: 'Create or update a group profile',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields)
    },
    {
      name: 'Create or update a user profile',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields)
    }
  ],

  actions: {
    identify,
    group
  }
}

export default destination
