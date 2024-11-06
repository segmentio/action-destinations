import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  segment_computation_action: {
    label: 'Segment Computation Class',
    description: "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
    type: 'string',
    unsafe_hidden: true,
    required: true,
    default: {
      '@path': '$.context.personas.computation_class'
    },
    choices: [{ label: 'audience', value: 'audience' }]
  },
  external_audience_id: {
    type: 'string',
    label: 'Audience ID',
    description: 'Unique Audience Identifier returned by the createAudience() function call.',
    required: true,
    unsafe_hidden: true,
    default: {
      '@path': '$.context.personas.external_audience_id'
    }
  },
  primary_email: {
    label: 'Email Address',
    description: `The contact's email address.`,
    type: 'string',
    allowNull: true,
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.traits.email' },
        then: { '@path': '$.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    }
  },
  phone_number_id: {
    label: 'Phone Number ID',
    description: `Primary Phone Number used to identify a Contact. This must be a valid phone number.`,
    type: 'string',
    allowNull: true,
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.traits.phone' },
        then: { '@path': '$.traits.phone' },
        else: { '@path': '$.properties.phone' }
      }
    }
  },
  external_id: {
    label: 'External ID',
    description: `The contact's External ID.`,
    type: 'string',
    allowNull: true,
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.traits.external_id' },
        then: { '@path': '$.traits.external_id' },
        else: { '@path': '$.properties.external_id' }
      }
    }
  },
  anonymous_id: {
    label: 'Anonymous ID ',
    description: `The contact's Anonymous ID.`,
    type: 'string',
    allowNull: true,
    required: false,
    default: { '@path': '$.anonymousId' }
  },
  traits_or_props: {
    label: 'Traits or properties object',
    description: 'A computed object for track and identify events. This field should not need to be edited.',
    type: 'object',
    required: true,
    unsafe_hidden: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties' },
        then: { '@path': '$.properties' },
        else: { '@path': '$.traits' }
      }
    }
  },
  enable_batching: {
    type: 'boolean',
    label: 'Batch events',
    description:
      'When enabled, the action will batch events before sending them to LaunchDarkly. In most cases, batching should be enabled.',
    required: false,
    default: true
  },
  batch_size: {
    type: 'number',
    label: 'Max batch size',
    description: 'The maximum number of events to batch when sending data to Reddit.',
    required: false,
    default: 2500
  }
}
