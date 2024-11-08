import type { ActionDefinition } from '@segment/actions-core'
import { cartFields } from '../fields/cartFields'
import { commonFields } from '../fields/commonFields'
import { customerFields } from '../fields/customerFields'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Base Event',
  description: 'Send a base event that has the basic fields applicable to all events.',
  fields: {
    ...commonFields,
    ...customerFields,
    ...cartFields,
    eventName: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the event to track.',
      required: true,
      choices: [
        { label: 'page_viewed', value: 'page_viewed' },
        { label: 'cart_viewed', value: 'cart_viewed' }
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
