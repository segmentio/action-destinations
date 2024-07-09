import type { ActionDefinition } from '@segment/actions-core'
import { checkoutFields } from '../fields/checkoutFields'
import { commonFields } from '../fields/commonFields'
import { customerFields } from '../fields/customerFields'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Checkout Event',
  description: 'Save a checkout event.',
  fields: {
    ...commonFields,
    ...customerFields,
    ...checkoutFields,
    eventName: {
      label: 'Checkout Event Name',
      type: 'string',
      description: 'The name of the Checkout Event to track.',
      required: true,
      choices: [
        { label: 'checkout_address_info_submitted', value: 'checkout_address_info_submitted' },
        { label: 'checkout_completed', value: 'checkout_completed' },
        { label: 'checkout_contact_info_submitted', value: 'checkout_contact_info_submitted' },
        { label: 'checkout_shipping_info_submitted', value: 'checkout_shipping_info_submitted' },
        { label: 'checkout_started', value: 'checkout_started' }
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
