import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  visitorId: {
    label: 'Visitor ID',
    description: 'The Pendo Visitor ID for the user. Maps to the userId in Segment by default.',
    type: 'string',
    required: true,
    default: {
      '@path': '$.userId'
    }
  },
  segmentAudienceId: {
    label: 'Segment External Audience ID',
    description: 'The External Audience ID from Segment, which maps to the Pendo Segment ID.',
    type: 'string',
    required: true,
    unsafe_hidden: true,
    default: {
      '@path': '$.context.personas.external_audience_id'
    }
  },
  enable_batching: {
    label: 'Batch events',
    description: 'When enabled, events are batched and sent to Pendo using the batch patch endpoint (up to 1000 visitors per request).',
    type: 'boolean',
    required: true,
    default: true
  },
  batch_size: {
    label: 'Max Batch Size',
    description: 'Maximum number of visitors to include in a single batch request. Must be between 1 and 1000.',
    type: 'integer',
    required: false,
    default: 1000,
    minimum: 1,
    maximum: 1000
  }
}
