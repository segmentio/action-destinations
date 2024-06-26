import type { ActionDefinition } from '@segment/actions-core'
import { cart } from '../fields/cartFields'
import { customer } from '../fields/customerFields'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import { transformPayload } from './transform-payload'
import type { Payload } from './generated-types'
import { commonFields } from '../fields/commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Base Event',
  description: 'Send a base event that has the basic fields applicable to all events.',
  fields: {
    ...commonFields,
    eventName: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the event to track.',
      required: true,
      choices: [
        { label: 'page_viewed', value: 'page_viewed' },
        { label: 'cart_viewed', value: 'cart_viewed' }
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
