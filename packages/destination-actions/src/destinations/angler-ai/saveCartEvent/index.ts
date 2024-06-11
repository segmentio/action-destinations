import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { product, productDefaultProperties } from '../fields'
import saveBaseEvent from '../saveBaseEvent'
import { transformPayload } from './transform-payload'
import { baseURL, eventsEndpoint } from '../routes'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Cart Event',
  description: 'Save a cart event.',
  fields: {
    cartLine: {
      ...product,
      label: 'Cart Line',
      description: 'Cart Line details',
      properties: {
        ...product.properties,
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'Quantity of the item'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            ...productDefaultProperties,
            quantity: {
              '@path': '$.quantity'
            }
          }
        ]
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
