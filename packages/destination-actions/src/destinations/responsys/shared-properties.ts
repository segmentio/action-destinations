import { InputField } from '@segment/actions-core/destination-kit/types'

export const folder_name: InputField = {
  label: 'Folder Name',
  description:
    'The name of the folder where the new Profile Extension Table will be created. Overrides the default folder name in Settings.',
  type: 'string',
  required: false,
  default: 'Segment'
}

export const recipient_data: InputField = {
  label: 'Recipient Data',
  description: 'Record data that represents field names and corresponding values for each profile.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  required: true,
  additionalProperties: false,
  properties: {
    EMAIL_ADDRESS_: {
      label: 'Email address',
      description: "The user's email address.",
      type: 'string',
      format: 'email',
      required: false
    },
    CUSTOMER_ID_: {
      label: 'Customer ID',
      description: 'Responsys Customer ID.',
      type: 'string',
      required: false
    },
    RIID_: {
      label: 'Recipient ID',
      description:
        'Recipient ID (RIID). RIID is required if Email Address and Customer ID are empty. Only use it if the corresponding profile already exists in Responsys.',
      type: 'string',
      required: false
    }
  },
  default: {
    EMAIL_ADDRESS_: {
      '@if': {
        exists: { '@path': '$.traits.email' },
        then: { '@path': '$.traits.email' },
        else: { '@path': '$.context.traits.email' }
      }
    },
    CUSTOMER_ID_: { '@path': '$.userId' }
  }
}

export const retry: InputField = {
  label: 'Delay (seconds)',
  description: `A delay of the selected seconds will be added before retrying a failed request.
                Max delay allowed is 600 secs (10 mins). The default is 0 seconds.`,
  type: 'number',
  choices: [
    { label: '0 secs', value: 0 },
    { label: '30 secs', value: 30 },
    { label: '120 secs', value: 120 },
    { label: '300 secs', value: 300 },
    { label: '480 secs', value: 480 },
    { label: '600 secs', value: 600 }
  ],
  required: false,
  unsafe_hidden: true,
  default: 0
}

export const use_responsys_async_api: InputField = {
  label: 'Use Responsys Async API',
  description: 'Once enabled, Segment will collect events into batches of 200 before sending to Responsys.',
  type: 'boolean',
  default: true,
  unsafe_hidden: true
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  required: false,
  unsafe_hidden: true,
  default: 200
}
