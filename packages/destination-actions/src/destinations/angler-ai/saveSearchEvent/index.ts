import type { ActionDefinition } from '@segment/actions-core'
import { cartFields } from '../fields/cartFields'
import { commonFields } from '../fields/commonFields'
import { customerFields } from '../fields/customerFields'
import { productsFields } from '../fields/productsFields'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Search Event',
  description: 'Save a search event.',
  fields: {
    searchResults: {
      ...productsFields,
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
      description: 'The name of the Search event to track.',
      required: true,
      readOnly: true,
      choices: [{ label: 'search_submitted', value: 'search_submitted' }],
      default: 'search_submitted'
    },
    ...cartFields,
    customerFields
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
