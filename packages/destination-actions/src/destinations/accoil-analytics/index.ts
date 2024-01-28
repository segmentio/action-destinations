import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import postToAccoil from './postToAccoil'

const destination: DestinationDefinition<Settings> = {
  name: 'Accoil Analytics',
  slug: 'actions-accoil-analytics',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Your Accoil.com API Key. This key requires Write permissions.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      try {
        return await request(`https://in.accoil.com/segment`, {
          method: 'get',
          headers: {
            'x-api-token': settings.api_key
          }
        })
      } catch (e: any) {
        // const error = e as AggregationsAuthError
        if (e.response.data) {
          const { message } = e.response.data
          console.log('THIS IS ERROR', message)
          // throw new InvalidAuthenticationError(message)
        }
        // throw new InvalidAuthenticationError('Error Validating Credentials')
      }
    }

    // onDelete: async (request, { settings, payload }) => {
    //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    //   // provided in the payload. If your destination does not support GDPR deletion you should not
    //   // implement this function and should remove it completely.

    // },
  },
  actions: {
    postToAccoil
  }
}

export default destination
