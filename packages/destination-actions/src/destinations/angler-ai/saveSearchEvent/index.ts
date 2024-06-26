import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { products } from '../fields/productsFields'
import { commonFields } from '../fields/commonFields'
import { transformPayload } from './transform-payload'
import { baseURL, eventsEndpoint } from '../routes'
import { cart } from '../fields/cartFields'
import { customer } from '../fields/customerFields'

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
    ...commonFields,
    eventName: {
      label: 'Search Event Name',
      type: 'string',
      description: 'The name of the event to track.',
      required: true,
      readOnly: true,
      choices: [
        { label: 'search_submitted', value: 'search_submitted' }
      ],
      default: 'search_submitted'
    },
    ...cart,
    customer
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
