import type { ActionDefinition } from '@segment/actions-core'
import { cartLineFields } from '../fields/cartLineFields'
import { commonFields } from '../fields/commonFields'
import { customerFields } from '../fields/customerFields'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Cart Event',
  description: 'Save a cart event.',
  fields: {
    ...commonFields,
    ...customerFields,
    ...cartLineFields,
    eventName: {
      label: 'Cart Event Name',
      type: 'string',
      description: 'The name of the Cart Event to track.',
      required: true,
      choices: [
        { label: 'product_added_to_cart', value: 'product_added_to_cart' },
        { label: 'product_removed_from_cart', value: 'product_removed_from_cart' }
      ]
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
