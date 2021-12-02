import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { client_id } from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Search',
  description: 'Send event when a user searches your content',
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  fields: {
    client_id: { ...client_id },
    search_term: {
      label: 'Search Term',
      type: 'string',
      description: 'The term that was searched for.',
      required: true,
      default: {
        '@path': `$.properties.query`
      }
    }
  },
  perform: (request, { payload }) => {
    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        events: [
          {
            name: 'search',
            params: {
              search_term: payload.search_term
            }
          }
        ]
      }
    })
  }
}

export default action
