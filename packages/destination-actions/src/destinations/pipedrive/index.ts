import createUpdateOrganization from './createUpdateOrganization'
import createUpdatePerson from './createUpdatePerson'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createUpdateActivity from './createUpdateActivity'

import createUpdateDeal from './createUpdateDeal'

import createUpdateLead from './createUpdateLead'

const destination: DestinationDefinition<Settings> = {
  name: 'Pipedrive',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      domain: {
        label: 'Domain',
        description: 'Pipedrive domain. This is found in Pipedrive in Settings > Company settings > Company domain.',
        type: 'string',
        // minLength: 1,
        required: true
      },
      apiToken: {
        label: 'API Token',
        description:
          'Pipedrive API token. This is found in Pipedrive in Settings > Personal preferences > API > Your personal API token.',
        type: 'string',
        // minLength: 20,
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`https://${settings.domain}.pipedrive.com/api/v1/users/me`)
    }
  },

  extendRequest({ settings }) {
    return {
      searchParams: {
        api_token: settings.apiToken
      }
    }
  },

  actions: {
    createUpdateOrganization,
    createUpdatePerson,
    createUpdateActivity,
    createUpdateDeal,
    createUpdateLead
  }
}

export default destination
