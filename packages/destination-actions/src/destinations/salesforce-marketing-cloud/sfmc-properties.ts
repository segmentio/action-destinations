import { InputField } from '@segment/actions-core/destination-kit/types'

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
    'The external key of the data extension that you want to store information in. The data extension must be predefined in SFMC. The external key is required if a Data Extension ID is not provided.',
  type: 'string'
}

export const id: InputField = {
  label: 'Data Extension ID',
  description:
    'The ID of the data extension that you want to store information in. The data extension must be predefined in SFMC. The ID is required if a Data Extension Key is not provided.',
  type: 'string'
}

export const keys: InputField = {
  label: 'Data Extension Primary Keys',
  description:
    'The primary key(s) that uniquely identify a row in the data extension. On the left-hand side, input the SFMC key name. On the right-hand side, map the Segment field that contains the corresponding value. When multiple primary keys are provided, SFMC will update an existing row if all primary keys match, otherwise a new row will be created',
  type: 'object',
  required: true,
  defaultObjectUI: 'keyvalue:only',
  additionalProperties: true
}

export const values_contactFields: InputField = {
  label: 'Contact Fields',
  description:
    'The fields in the data extension that contain data about a contact, such as Email, Last Name, etc. Fields must be created in the data extension before sending data for it. On the left-hand side, input the SFMC field name exactly how it appears in the data extension. On the right-hand side, map the Segment field that contains the corresponding value.',
  type: 'object',
  defaultObjectUI: 'keyvalue:only',
  required: true
}

export const values_dataExtensionFields: InputField = {
  label: 'Data Extension Fields',
  description:
    'The fields in the data extension that contain data about an event, such as Product Name, Revenue, Event Time, etc. Fields must be created in the data extension before sending data for it. On the left-hand side, input the SFMC field name exactly how it appears in the data extension. On the right-hand side, map the Segment field that contains the corresponding value.',
  type: 'object',
  defaultObjectUI: 'keyvalue:only',
  required: true
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
    'The properties of the event. Fields must be created in the event definition schema before sending data for it. On the left-hand side, input the SFMC field name exactly how it appears in the event definition schema. On the right-hand side, map the Segment field that contains the corresponding value.',
  type: 'object',
  defaultObjectUI: 'keyvalue:only'
}

export const enable_batching: InputField = {
  label: 'Batch data to SFMC',
  description: 'If true, data is batched before sending to the SFMC Data Extension.',
  type: 'boolean',
  default: false
}
