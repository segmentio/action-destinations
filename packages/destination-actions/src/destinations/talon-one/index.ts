import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createAudience from './createAudience'
import updateAudience from './updateAudience'
import deleteAudience from './deleteAudience'
import updateCustomerProfile from './updateCustomerProfile'
import updateCustomerProfilesAudiences from './updateCustomerProfilesAudiences'
import trackEvent from './trackEvent'
import updateCustomerProfileV2 from './updateCustomerProfileV2'
import updateCustomerSession from './updateCustomerSession'
import trackEventV2 from './trackEventV2'
import updateCustomerSessionV2 from './updateCustomerSessionV2'
import updateCustomerProfileV3 from './updateCustomerProfileV3'

const destination: DestinationDefinition<Settings> = {
  name: 'Talon.One (Actions)',
  slug: 'actions-talon-one',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Created under Developer Settings in the Talon.One Campaign Manager.',
        type: 'string',
        required: true
      },
      deployment: {
        type: 'string',
        label: 'Deployment',
        description: 'The base URL of your Talon.One deployment.',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      return request(`${settings.deployment}/v2/authping`, { method: 'GET' })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `ApiKey-v1 ${settings.apiKey}`,
        'destination-hostname': `${settings.deployment}`
      }
    }
  },

  actions: {
    createAudience,
    updateAudience,
    deleteAudience,
    updateCustomerProfile,
    updateCustomerProfileV2,
    updateCustomerProfileV3,
    updateCustomerProfilesAudiences,
    trackEvent,
    trackEventV2,
    updateCustomerSession,
    updateCustomerSessionV2
  }
}

export default destination
