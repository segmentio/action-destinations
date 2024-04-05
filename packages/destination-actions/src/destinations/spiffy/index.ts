import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Spiffy',
  slug: 'actions-spiffy',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
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
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      console.debug(`testAuthentication ${request}`)
      return true
    }
  },

  extendRequest({ settings }) {
    return {
      username: settings.org_id,
      password: settings.api_key
    }
  },

  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
    console.debug(`onDelete request=${request} settings=${settings} payload=${payload}`)
  },

  actions: {
    send
  }
}

export default destination
