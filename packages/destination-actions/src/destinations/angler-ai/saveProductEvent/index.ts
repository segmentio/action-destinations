import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { product } from '../fields'
import { commonFields } from '../fields/commonFields'
import { transformPayload } from './transform-payload'
import { baseURL, eventsEndpoint } from '../routes'
import { cart, customer } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Product Event',
  description: 'Save a product event.',
  fields: {
    productVariant: {
      ...product,
      label: 'Product Variant',
      description: 'Product Variant details'
    },
    ...commonFields,
    eventName: {
      label: 'Product Event Name',
      type: 'string',
      description: 'The name of the event to track.',
      required: true,
      readOnly: true,
      choices: [
        { label: 'product_viewed', value: 'product_viewed' }
      ],
      default: 'product_viewed'
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
