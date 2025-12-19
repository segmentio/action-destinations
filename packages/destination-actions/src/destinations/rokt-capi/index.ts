import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Rokt Capi',
  slug: 'actions-rokt-capi',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Rokt CAPI API Key. Contact your Rokt representative to obtain this value.',
        type: 'string',
        format: 'password',
        required: true
      }, 
      apiSecret: {
        label: 'API Secret',
        description: 'Your Rokt CAPI API Secret. Contact your Rokt representative to obtain this value.',
        type: 'string',
        format: 'password',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },
  extendRequest: ({ settings }) => {
    const {
      apiKey,
      apiSecret
    } = settings

    return {
      headers: { 
        authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
      }
    }
  },
  actions: {
    send
  }
}

export default destination
