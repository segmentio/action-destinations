import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { products } from '../fields'
import saveBaseEvent from '../saveBaseEvent'
import { transformPayload } from './transform-payload'
import { baseURL, eventsEndpoint } from '../routes'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Search Event',
  description: 'Save a search event.',
  fields: {
    searchResults: {
      ...products,
      label: 'Search Results',
      description: 'Search results details'
    },
    query: {
      type: 'string',
      label: 'Search Query',
      description: 'The search query that was executed.',
      default: {
        '@path': '$.properties.query'
      }
    },
    ...saveBaseEvent.fields
  },
  perform: (request, data) => {
    const transformedPayload = transformPayload(data.payload)

    const payload = {
      src: 'SEGMENT',
      data: [transformedPayload]
    }
    return request(baseURL + eventsEndpoint(data.settings.workspaceId), {
      method: 'post',
      json: payload
    })
  }
}

export default action
