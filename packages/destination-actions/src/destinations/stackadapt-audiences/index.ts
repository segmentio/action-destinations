import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import postMessage from './postMessage'

// TODO: change to production
export const domain = 'https://sandbox.stackadapt.com/public/graphql'
const destination: DestinationDefinition<Settings> = {
  name: 'Stackadapt Audiences',
  slug: 'actions-stackadapt-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'GraphQL Token',
        description: 'Your StackAdapt GQL API Token',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request) => {
      const res = await request(domain)
      if (res.status !== 200) {
        throw new Error(res.status + res.statusText)
      }
    }
  },
  extendRequest: ({ settings }) => {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`
      }
    }
  },
  actions: {
    postMessage
  }
}

export default destination
