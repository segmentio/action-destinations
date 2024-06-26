import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'
import { baseURL, eventsEndpoint } from '../routes'
import { commonFields } from '../fields/commonFields'
import { checkoutFields } from '../fields/checkoutFields'
import { cart } from '../fields/cartFields'
import { customer } from '../fields/customerFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Checkout Event',
  description: 'Save a checkout event.',
  fields: {
    ...checkoutFields,
    ...commonFields,
    eventName: {
      label: 'Cart Event Name',
      type: 'string',
      description: 'The name of the Cart Event to track.',
      required: true,
      choices: [
        { label: 'checkout_address_info_submitted', value: 'checkout_address_info_submitted' },
        { label: 'checkout_completed', value: 'checkout_completed' },
        { label: 'checkout_contact_info_submitted', value: 'checkout_contact_info_submitted' },
        { label: 'checkout_shipping_info_submitted', value: 'checkout_shipping_info_submitted' },
        { label: 'checkout_started', value: 'checkout_started' }
      ]
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
