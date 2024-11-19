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
    format: 'email',
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
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.traits.phone' },
        then: { '@path': '$.traits.phone' },
        else: { '@path': '$.properties.phone' }
      }
    }
  },
  user_attributes: {
    label: 'User Attributes',
    description: `Additional user attributes to be included in the request.`,
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue',
    additionalProperties: false,
    properties: {
      first_name: {
        label: 'First Name',
        description: `The contact's first name.`,
        type: 'string'
      },
      last_name: {
        label: 'Last Name',
        description: `The contact's last name.`,
        type: 'string'
      },
      address_line_1: {
        label: 'Address Line 1',
        description: `The contact's address line 1.`,
        type: 'string'
      },
      address_line_2: {
        label: 'Address Line 2',
        description: `The contact's address line 2.`,
        type: 'string'
      },
      city: {
        label: 'City',
        description: `The contact's city.`,
        type: 'string'
      },
      state_province_region: {  
        label: 'State/Province/Region',
        description: `The contact's state, province, or region.`,
        type: 'string'
      },
      country: {
        label: 'Country',
        description: `The contact's country.`,
        type: 'string'
      },
      postal_code: {
        label: 'Postal Code',
        description: `The contact's postal code.`,
        type: 'string'
      }
    },
    default: {
      first_name: {       
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        } 
      },
      last_name: {       
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        } 
      },
      address_line_1: {       
        '@if': {
          exists: { '@path': '$.traits.street' },
          then: { '@path': '$.traits.street' },
          else: { '@path': '$.properties.street' }
        } 
      },
      address_line_2: {       
        '@if': {
          exists: { '@path': '$.traits.address_line_2' },
          then: { '@path': '$.traits.address_line_2' },
          else: { '@path': '$.properties.address_line_2' }
        } 
      },
      city: {       
        '@if': {
          exists: { '@path': '$.traits.city' },
          then: { '@path': '$.traits.city' },
          else: { '@path': '$.properties.city' }
        } 
      },
      state_province_region: {       
        '@if': {
          exists: { '@path': '$.traits.state' },
          then: { '@path': '$.traits.state' },
          else: { '@path': '$.properties.state' }
        } 
      },
      country: {       
        '@if': {
          exists: { '@path': '$.traits.country' },
          then: { '@path': '$.traits.country' },
          else: { '@path': '$.properties.country' }
        } 
      },
      postal_code: {       
        '@if': {
          exists: { '@path': '$.traits.postal_code' },
          then: { '@path': '$.traits.postal_code' },
          else: { '@path': '$.properties.postal_code' }
        } 
      }
    }
  },
  custom_fields: {
    label: 'Custom Fields',
    description: `Custom Field values to be added to the Contact. The Custom Fields must already be defined in Sendgrid. Custom Field values must be string, numbers or dates.`,
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue',
    additionalProperties: true,
    dynamic: true
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
