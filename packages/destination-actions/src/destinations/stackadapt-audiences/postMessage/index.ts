import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { domain } from '..'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post Message',
  description: '',
  fields: {
    query: {
      label: 'The GQL query',
      description: 'The GQL query string',
      type: 'string',
      default: `query {
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
    },
    variables: {
      label: 'The GQL query variables',
      description: 'The variables for GQL query',
      type: 'object',
      default: ''
    }
  },
  perform: (request, { payload }) => {
    return request(domain, {
      body: JSON.stringify({ query: payload.query, variables: payload.variables })
    })
  }
}

export default action
