import type { ActionDefinition } from '@segment/actions-core'
import { cartFields } from '../fields/cartFields'
import { commonFields } from '../fields/commonFields'
import { customerFields } from '../fields/customerFields'
import { formFields } from '../fields/formFields'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Form Event',
  description: 'Save a form event.',
  fields: {
    ...commonFields,
    ...customerFields,
    ...cartFields,
    ...formFields,
    eventName: {
      label: 'Form Event Name',
      type: 'string',
      description: 'The name of the Form Event to track.',
      required: true,
      readOnly: true,
      choices: [{ label: 'form_submitted', value: 'form_submitted' }],
      default: 'form_submitted'
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
