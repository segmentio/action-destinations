import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Form',
  description: 'Submit a lead to a Marketo form using the Forms 2.0 submitForm API.',
  defaultSubscription: 'event = "Form Submitted" or event = "Registration Succeeded"',
  fields: {
    event_name: {
      label: 'Event Name',
      description:
        'The name of the Segment event. Only "Form Submitted" and "Registration Succeeded" events are processed.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Form Submitted', value: 'Form Submitted' },
        { label: 'Registration Succeeded', value: 'Registration Succeeded' }
      ],
      default: { '@path': '$.event' }
    },
    email: {
      label: 'Email',
      description: 'The email address of the lead to submit to Marketo.',
      type: 'string',
      format: 'email',
      required: true,
      default: { '@path': '$.properties.email' }
    },
    formId: {
      label: 'Form ID',
      description: 'The ID of the Marketo form to submit to.',
      type: 'string',
      required: true
    },
    leadFormFields: {
      label: 'Lead Form Fields',
      description: 'The full set of lead form fields to submit to the Marketo form.',
      type: 'object',
      required: true
    },
    visitorData: {
      label: 'Visitor Data',
      description:
        'The visitor data to send to Marketo. This is used to associate the lead with the correct visitor in Marketo.',
      type: 'object',
      required: true
    },
    cookie: {
      label: 'Cookie',
      description:
        'The Marketo cookie to send to Marketo. This is used to associate the lead with the correct visitor in Marketo.',
      type: 'string',
      required: false
    }
  },
  perform: (request, { settings, payload }) => {
    return send(request, settings, payload)
  }
}

export default action
