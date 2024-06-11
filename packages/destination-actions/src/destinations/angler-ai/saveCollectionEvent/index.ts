import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { products } from '../fields'
import saveBaseEvent from '../saveBaseEvent'
import { transformPayload } from './transform-payload'
import { baseURL, eventsEndpoint } from '../routes'

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
      ...products,
      label: 'Collection Product Variants',
      description: 'A list of product variants associated with the collection.'
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
