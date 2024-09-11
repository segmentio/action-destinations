import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import forwardProfile from './forwardProfile'

// TODO: change to production
export const domain = 'https://sandbox.stackadapt.com/public/graphql'
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
          name
          expiresAt
          createdAt
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
      const scopes: string[] = JSON.parse(res.content)?.data?.tokenInfo?.scopesByAdvertiser?.nodes?.flatMap(
        (node: { scopes: string[] }) => node.scopes
      )
      if (!scopes.includes('WRITE')) {
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
