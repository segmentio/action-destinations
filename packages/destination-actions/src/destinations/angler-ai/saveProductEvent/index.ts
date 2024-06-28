import type { ActionDefinition } from '@segment/actions-core'
import { cartFields } from '../fields/cartFields'
import { commonFields } from '../fields/commonFields'
import { customerFields } from '../fields/customerFields'
import { productFields } from '../fields/productFields'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Product Event',
  description: 'Save a product event.',
  fields: {
    productVariant: {
      ...productFields,
      label: 'Product Variant',
      description: 'Product Variant details'
    },
    ...commonFields,
    eventName: {
      label: 'Product Event Name',
      type: 'string',
      description: 'The name of the Product event to track.',
      required: true,
      readOnly: true,
      choices: [{ label: 'product_viewed', value: 'product_viewed' }],
      default: 'product_viewed'
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
