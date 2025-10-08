import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import updateProfile from './updateProfile'
import { API_VERSION } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Batch (Actions)',
  slug: 'actions-batch',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiToken: {
        label: 'REST API Key',
        description: 'Token used to authorize sending data to the Destination platform',
        type: 'password',
        required: true
      },
      projectKey: {
        label: 'Project Key',
        description: 'The unique project key identifying your project in the Destination platform',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request) => {
      return await request(`https://api.batch.com/${API_VERSION}/profiles/update`, {
        method: 'POST',
        // Sample body for test
        body: JSON.stringify([
          {
            identifiers: {
              custom_id: 'test-custom-id'
            }
          }
        ])
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiToken}`,
        'X-Batch-Project': `${settings.projectKey}`
      }
    }
  },
  actions: {
    updateProfile
  },
  presets: [
    {
      name: 'Update Profile',
      subscribe: 'type = "identify" or type = "track"',
      partnerAction: 'updateProfile',
      mapping: defaultValues(updateProfile.fields),
      type: 'automatic'
    }
  ]
}

export default destination
