import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Spiffy',
  slug: 'actions-spiffy',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      org_id: {
        label: 'Organization ID',
        description: 'Spiffy Org ID',
        type: 'string',
        required: true
      },
      api_key: {
        label: 'API Key',
        description: 'Spiffy Org API Key',
        type: 'string',
        required: true
      },
      environment: {
        label: 'Spiffy Environment',
        description: 'Spiffy Org Environment',
        type: 'string',
        required: true,
        choices: [
          {
            value: 'prod',
            label: 'Production'
          },
          {
            value: 'dev',
            label: 'Development'
          }
        ]
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      console.debug(`testAuthentication ${request}`)
      return request('https://track.customer.io/auth')
    }
  },

  extendRequest({ settings }) {
    return {
      headers: { Authorization: `Bearer ${settings.org_id}:${settings.api_key}` },
      responseType: 'json'
    }
  },
  actions: {
    send
  }
}

export default destination
