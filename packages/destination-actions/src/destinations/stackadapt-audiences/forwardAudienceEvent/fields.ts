import { InputField } from '@segment/actions-core'
import { MarketingStatus } from './constants'

export const audience_only_fields: Record<string, InputField> = {
    traits_or_props: {
      label: 'Event Properties',
      type: 'object',
      description: 'The properties of the user or event.',
      unsafe_hidden: true,
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    },
    segment_computation_class: {
      label: 'Segment Computation Class',
      required: true,
      description: "Segment computation class used to determine if input event is from an Engage Audience'.",
      type: 'string',
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' },{ label: 'journey_step', value: 'journey_step' }]
    },
    segment_computation_id: {
      label: 'Segment Computation ID',
      description: 'For audience enter/exit events, this will be the audience ID.',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    segment_computation_key: {
      label: 'Segment Computation Key',
      description: 'For audience enter/exit events, this will be the audience key.',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    }
}

export const profile_fields: Record<string, InputField> = {
    standard_traits: {
      label: 'Standard User Properties',
      type: 'object',
      description: 'Standard properties for the user.',
      defaultObjectUI: 'keyvalue',
      additionalProperties: false,
      required: false,
      properties: {
        first_name: {
          label: 'First Name',
          type: 'string',
          description: "The user's first name."
        },
        last_name: {
          label: 'Last Name',
          type: 'string',
          description: "The user's last name."
        },
        phone: {
          label: 'Phone',
          type: 'string',
          description: 'The phone number of the user.'
        },
        address: {
          label: 'Address',
          type: 'string',
          description: 'The address of the user.'
        },
        city: {
          label: 'City',
          type: 'string',
          description: 'The city of the user.'
        },
        country: {
          label: 'Country',
          type: 'string',
          description: 'The country of the user.'
        },
        state: {
          label: 'State',
          type: 'string',
          description: 'The state of the user.'
        },
        timezone: {
          label: 'Time Zone',
          type: 'string',
          description: 'The timezone of the user.'
        },
        postal_code: {
          label: 'Postal Code',
          type: 'string',
          description: 'The postal code of the user.'
        },
        birth_date: {
          label: 'Birth Date',
          type: 'string',
          format: 'date',
          description: "The birthday of the user in YYYY-MM-DD format."
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
        phone: {
          '@if': {
            exists: { '@path': '$.traits.phone' },
            then: { '@path': '$.traits.phone' },
            else: { '@path': '$.properties.phone' }
          }
        },
        address: {
          '@if': {
            exists: { '@path': '$.traits.street' },
            then: { '@path': '$.traits.street' },
            else: { '@path': '$.properties.street' }
          }
        },
        city: {
          '@if': {
            exists: { '@path': '$.traits.city' },
            then: { '@path': '$.traits.city' },
            else: { '@path': '$.properties.city' }
          }
        },
        country: {
          '@if': {
            exists: { '@path': '$.traits.country' },
            then: { '@path': '$.traits.country' },
            else: { '@path': '$.properties.country' }
          }
        },
        state: {
          '@if': {
            exists: { '@path': '$.traits.state' },
            then: { '@path': '$.traits.state' },
            else: { '@path': '$.properties.state' }
          }
        },
        postal_code: {
          '@if': {
            exists: { '@path': '$.traits.postal_code' },
            then: { '@path': '$.traits.postal_code' },
            else: { '@path': '$.properties.postal_code' }
          }
        },
        timezone: {
          '@if': {
            exists: { '@path': '$.traits.timezone' },
            then: { '@path': '$.traits.timezone' },
            else: { '@path': '$.properties.timezone' }
          }
        },
        birth_date: {
          '@if': {
            exists: { '@path': '$.traits.birthday' },
            then: { '@path': '$.traits.birthday' },
            else: { '@path': '$.properties.birthday' }
          }
        }
      }
    },
    custom_traits: {
      label: 'Custom User Properties',
      type: 'object',
      description: 'Custom properties for the user.',
      defaultObjectUI: 'keyvalue',
      required: false
    },
    user_id: {
      label: 'Segment User ID',
      description: 'The ID of the user in Segment',
      type: 'string',
      default: {
        // By default we want to use the permanent user id that's consistent across a customer's lifetime.
        // But if we don't have that we can fall back to the anonymous id
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    event_type: {
      label: 'Event Type',
      description: 'The Segment event type - track or identify',
      type: 'string',
      required: true,
      default: {
        '@path': '$.type'
      }
    },
    marketing_status: {
      label: 'Marketing Status',
      description: 'In certain jurisdictions, explicit consent may be required to send email marketing communications to imported profiles. Consult independent counsel for further guidance.',
      type: 'string',
      required: true,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      choices: [
        { label: 'Opted-in (Profiles can receive email marketing)', value: MarketingStatus.OPT_IN },
        { label: 'Indeterminate (Profiles that have not opted-out, but are excluded from email marketing)', value: MarketingStatus.Indeterminate }
      ]
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Profiles',
      unsafe_hidden: true,
      description:
        'When enabled, Segment will batch profiles together and send them to StackAdapt in a single request.',
      required: true,
      default: true
    }
}