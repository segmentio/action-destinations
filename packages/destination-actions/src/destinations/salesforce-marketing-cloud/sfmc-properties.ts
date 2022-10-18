import { InputField } from '@segment/actions-core/src/destination-kit/types'

export const contactKey: InputField = {
  label: 'Contact Key',
  description:
    'The unique identifier that you assign to a contact. This will be used to create a contact if one does not already exist with this Contact Key.',
  type: 'string',
  default: { '@path': '$.userId' }
}

export const contactKeyAPIEvent: InputField = {
  label: 'Contact Key',
  description: 'The unique identifier that identifies a subscriber or a contact.',
  type: 'string',
  default: { '@path': '$.userId' },
  required: true
}

export const key: InputField = {
  label: 'Data Extension Key',
  description:
    'The key of the data extension that you want to store contact information in. The data extension must be predefined in SFMC. Segment recommends storing all contact information in a single data extension. The key is required if a Data Extension ID is not provided.',
  type: 'string'
}
export const id: InputField = {
  label: 'Data Extension ID',
  description:
    'The ID of the data extension that you want to store contact information in. The data extension must be predefined in SFMC. Segment recommends storing all contact information in a single data extension. The ID is required if a Data Extension Key is not provided.',
  type: 'string'
}
export const keys: InputField = {
  label: 'Data Extension Primary Keys',
  description:
    'The primary key(s) that uniquely identify a contact in the data extension. At a minimum, Contact Key must exist in your data extension as a Primary Key. On the left-hand side, input the SFMC key name. On the right-hand side, map the Segment field that contains the corresponding value. When multiple primary keys are provided, SFMC will update an existing row if all primary keys match, otherwise a new row will be created.',
  type: 'object',
  required: true,
  defaultObjectUI: 'keyvalue:only',
  additionalProperties: true
}
export const values: InputField = {
  label: 'Contact Fields',
  description:
    'The fields in the data extension that contain data about a contact, such as Email, Last Name, etc. Fields must be created in the data extension before sending data for it.On the left-hand side, input the SFMC field name exactly how it appears in the data extension. On the right-hand side, map the Segment field that contains the corresponding value.',
  type: 'object',
  defaultObjectUI: 'keyvalue:only'
}
export const eventDefinitionKey: InputField = {
  label: 'Event Definition Key',
  description:
    'The unique key for an event definition in Salesforce Marketing Cloud. The event defintion must be predefined in SFMC. ',
  type: 'string',
  required: true
}
export const eventData: InputField = {
  label: 'Event Data',
  description:
    'The properties of the event. Fields must be created in the event definition schema before sending data for it.On the left-hand side, input the SFMC field name exactly how it appears in the event definition schema. On the right-hand side, map the Segment field that contains the corresponding value.',
  type: 'object',
  defaultObjectUI: 'keyvalue:only'
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'If true, data is batched before sending to the SFMC Data Extension to help reduce API calls.',
  type: 'boolean',
  default: false
}
