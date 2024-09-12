import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import forwardProfile from './forwardProfile'

export const domain = 'https://api.stackadapt.com/graphql'
const destination: DestinationDefinition<Settings> = {
  name: 'StackAdapt Audiences',
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
      const scopeQuery = `query {
        tokenInfo {
          scopesByAdvertiser {
            nodes {
              advertiser {
                name
              }
              scopes
            }
          }
        }
      }`

      const res = await request(domain, {
        body: JSON.stringify({ query: scopeQuery })
      })
      if (res.status !== 200) {
        throw new Error(res.status + res.statusText)
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const canWrite = (await res.json()).data?.tokenInfo?.scopesByAdvertiser?.nodes?.some(
        (node: { scopes: string[] }) => node.scopes.includes('WRITE')
      )
      if (!canWrite) {
        throw new Error('Please verify your GQL Token or contact support')
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
    forwardProfile
  }
}

export default destination
