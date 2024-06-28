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
  title: 'Save Collection Event',
  description: 'Save a collection event.',
  fields: {
    collection: {
      label: 'Collection',
      type: 'object',
      description: 'Collection details',
      additionalProperties: false,
      properties: {
        id: {
          label: 'Collection Id',
          type: 'string',
          description: 'A globally unique identifier for the collection.'
        },
        title: {
          label: 'Title',
          type: 'string',
          description: 'The collection title.'
        }
      },
      default: {
        id: {
          '@path': '$.properties.list_id'
        },
        title: {
          '@path': '$.properties.list_name'
        }
      }
    },
    collectionProductVariants: {
      ...productsFields,
      label: 'Collection Product Variants',
      description: 'A list of product variants associated with the collection.'
    },
    ...commonFields,
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
