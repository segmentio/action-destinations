import { InputField } from '@segment/actions-core/src/destination-kit/types'
import { IntegrationError } from '@segment/actions-core'

export const operation: InputField = {
  label: 'Operation',
  description: 'The Parodt operation performed. The available operation is upsert.',
  type: 'string',
  required: true,
  choices: [{ label: `Update or create a record if one doesn't exist`, value: 'upsert' }]
}

export const customFields: InputField = {
  label: 'Other Fields',
  description: `
  Additional prospect fields to send to Pardot. Only editable fields are accepted. On the left-hand side, input the Pardot field name. On the right-hand side, map the Segment field that contains the value.
  ---
  `,
  type: 'object',
  defaultObjectUI: 'keyvalue'
}

interface Payload {
  operation?: string
  traits?: object
}

export const validateLookup = (payload: Payload) => {
  if (payload.operation !== 'upsert') {
    throw new IntegrationError('Undefined operation', 'Misconfigured Required Field', 400)
  }
}
