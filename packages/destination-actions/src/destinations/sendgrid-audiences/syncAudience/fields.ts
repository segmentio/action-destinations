import { InputField } from '@segment/actions-core'
import { MAX_BATCH_SIZE } from '../constants'

export const fields: Record<string, InputField> = {
  segment_computation_action: {
    label: 'Segment Computation Class',
    description:
      "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
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
  segment_audience_key: {
    label: 'Audience Key',
    description: 'Segment Audience key',
    type: 'string',
    unsafe_hidden: true,
    required: true,
    default: {
      '@path': '$.context.personas.computation_key'
    }
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
  email: {
    label: 'Email Address',
    description: `The contact's email address.`,
    type: 'string',
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.traits.email' },
        then: { '@path': '$.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    }
  },
  anonymous_id: {
    label: 'Anonymous ID',
    description: `The contact's anonymous ID.`,
    type: 'string',
    required: false,
    default: { '@path': '$.anonymousId' }
  },
  external_id: {
    label: 'External ID',
    description: `The contact's external ID.`,
    type: 'string',
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.traits.external_id' },
        then: { '@path': '$.traits.external_id' },
        else: { '@path': '$.properties.external_id' }
      }
    }
  },
  phone_number_id: {
    label: 'Phone Number ID',
    description: `The contact's primary phone number. Should include the country code e.g. +19876543213.`,
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
  enable_batching: {
    type: 'boolean',
    label: 'Batch events',
    description: 'When enabled, the action will batch events before sending them to Sendgrid.',
    unsafe_hidden: true,
    required: true,
    default: true
  },
  batch_size: {
    type: 'number',
    label: 'Max batch size',
    description: 'The maximum number of events to batch when sending data to Reddit.',
    unsafe_hidden: true,
    required: false,
    default: MAX_BATCH_SIZE
  }
}
