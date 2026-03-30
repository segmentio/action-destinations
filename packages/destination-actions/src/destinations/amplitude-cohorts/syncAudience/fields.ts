import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  user_id: {
    label: 'User ID',
    description: 'Required if "ID Type" is set to "User ID".',
    type: 'string',
    default: { '@path': '$.userId' }
  },
  amplitude_id: {
    label: 'Amplitude ID',
    description: 'Required if "ID Type" is set to "Amplitude ID".',
    type: 'string'
  },
  segment_external_audience_id: {
    label: 'Segment External Audience ID',
    description:
      'Hidden field containing the Cohort ID which was returned when the Amplitude Cohort was created in the Audience Settings.',
    type: 'string',
    unsafe_hidden: true,
    required: true,
    default: { '@path': '$.context.personas.external_audience_id' }
  },
  batch_size: {
    label: 'Max Batch Size',
    description: 'The maximum number of users to process in a single batch request.',
    type: 'number',
    required: true,
    default: 100,
    maximum: 500,
    minimum: 1
  }
}
