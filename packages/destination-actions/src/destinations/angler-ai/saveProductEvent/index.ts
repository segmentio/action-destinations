import type { ActionDefinition } from '@segment/actions-core'
import { cartFields } from '../fields/cartFields'
import { commonFields } from '../fields/commonFields'
import { customerFields } from '../fields/customerFields'
import { productVariantFields } from '../fields/productVariantFields'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Product Event',
  description: 'Save a product event.',
  fields: {
    ...commonFields,
    ...customerFields,
    ...cartFields,
    ...productVariantFields,
    eventName: {
      label: 'Product Event Name',
      type: 'string',
      description: 'The name of the Product event to track.',
      required: true,
      readOnly: true,
      choices: [{ label: 'product_viewed', value: 'product_viewed' }],
      default: 'product_viewed'
    }
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
