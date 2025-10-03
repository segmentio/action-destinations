import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  external_audience_id: {
    type: 'string',
    label: 'External Audience ID',
    description: 'Unique Audience Identifier returned by the createAudience() function call.',
    required: true,
    unsafe_hidden: true,
    default: {
      '@path': '$.context.personas.external_audience_id'
    }
  },
  audienceKey: {
    type: 'string',
    label: 'Audience Key',
    description: 'Audience key.',
    required: true,
    unsafe_hidden: true,
    default: {
      '@path': '$.context.personas.computation_key'
    }
  },
  props: {
    label: 'Properties object',
    description: 'Object that contains audience name and value.',
    type: 'object',
    required: true,
    unsafe_hidden: true,
    default: { '@path': '$.properties' }
  },
  phone: {
    label: 'Phone',
    description: "If using phone as the identifier an additional setup step is required when connecting the Destination to the Audience. Please ensure that 'phone' is configured as an additional identifier in the Audience settings tab.",
    type: 'string',
    required: false,
    default: { '@path': '$.properties.phone' },
  },
  email: {
    label: 'Email',
    description: "The user's email address.",
    type: 'string',
    required: false,
    default: { '@path': '$.properties.email' },
  },
  advertising_id: {
    label: 'Mobile Advertising ID',
    description:
      "If using Mobile Ad ID as the identifier an additional setup step is required when connecting the Destination to the Audience. Please ensure that 'ios.idfa' is configured to 'ios_idfa' and 'android.idfa' is configured to 'android_idfa' in the Audience settings tab.",
    type: 'string',
    required: false,
    default: { 
      '@if': {
        exists: { '@path': '$.properties.android_idfa' },
        then: { '@path': '$.properties.android_idfa' },
        else: { '@path': '$.properties.ios_idfa' }
      }
    }
  },
  enable_batching: {
    label: 'Enable Batching',
    description: 'When enabled, events will be batched before being sent to Snap.',
    type: 'boolean',
    required: true,
    default: true
  },
  max_batch_size: {
    label: 'Max Batch Size',
    description: 'Maximum number of API calls to include in a batch. Defaults to 100,000 which is the maximum allowed by Snap.',
    type: 'number',
    required: true,
    minimum: 1,
    maximum: 100_000,
    default: 100_000
  },
  batch_keys: {
    label: 'Batch Keys',
    description: 'The keys to use for batching the events. Ensures events from different audiences are sent in separate batches. This is Segment default behavior with Engage Audiences anyway.',
    type: 'string',
    unsafe_hidden: true,
    required: false,
    multiple: true,
    default: ['external_audience_id']
  }
}