import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields/commonFields'
import { cart } from '../fields/cartFields'
import { customer } from '../fields/customerFields'
import { transformPayload } from './transform-payload'
import { baseURL, eventsEndpoint } from '../routes'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Form Event',
  description: 'Save a form event.',
  fields: {
    id: {
      type: 'string',
      label: 'Form ID',
      description: 'The id attribute of an element.'
    },
    action: {
      type: 'string',
      label: 'Action',
      description: 'The action attribute of a form element.'
    },
    elements: {
      type: 'object',
      multiple: true,
      label: 'Form Elements',
      description: 'A list of elements associated with the form.',
      properties: {
        id: {
          type: 'string',
          label: 'Element ID',
          description: 'The id attribute of an element.'
        },
        name: {
          type: 'string',
          label: 'Name',
          description: 'The name attribute of an element.'
        },
        tagName: {
          type: 'string',
          label: 'Tag Name',
          description: 'A string representation of the tag of an element.'
        },
        type: {
          type: 'string',
          label: 'Type',
          description: 'The type attribute of an element. Often relevant for an input or button element.'
        },
        value: {
          type: 'string',
          label: 'Value',
          description: 'The value attribute of an element. Often relevant for an input element.'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.form.elements',
          {
            id: { '@path': '$.id' },
            name: { '@path': '$.name' },
            tagName: { '@path': '$.tagName' },
            type: { '@path': '$.type' },
            value: { '@path': '$.value' }
          }
        ]
      }
    },
    ...commonFields,
    eventName: {
      label: 'Form Event Name',
      type: 'string',
      description: 'The name of the Cart Event to track.',
      required: true,
      readOnly: true,
      choices: [
        { label: 'form_submitted', value: 'form_submitted' }
      ], 
      default: 'form_submitted' 
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
