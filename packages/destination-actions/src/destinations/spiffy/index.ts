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
    testAuthentication: (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      const environment = settings.environment
      const url =
        environment == 'prod'
          ? 'https://segment-intake.spiffy.ai/v1/auth'
          : 'https://segment-intake.dev.spiffy.ai/v1/auth'
      return request(url)
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
