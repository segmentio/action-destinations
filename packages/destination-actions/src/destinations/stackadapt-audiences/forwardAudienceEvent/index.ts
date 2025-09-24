import { ActionDefinition } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { performForwardAudienceEvents } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Forward audience enter or exit events to StackAdapt',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
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
          label: 'Postal Code',
          type: 'string',
          description: 'The timezone of the user.'
        },
        postal_code: {
          label: 'Postal Code',
          type: 'string',
          description: 'The postal code of the user.'
        },
        birth_day: {
          label: 'Birth Day',
          type: 'string',
          description: 'The birth day of the user.'
        },
        birth_month: {
          label: 'Birth Month',
          type: 'string',
          description: 'The birth month of the user.'
        },
        birth_year: {
          label: 'Birth Year',
          type: 'string',
          description: 'The birth year of the user.'
        },
        birth_date: {
          label: 'Birth Date',
          type: 'string',
          description: 'The birth date of the user.'
        },
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
            exists: { '@path': '$.traits.address' },
            then: { '@path': '$.traits.address' },
            else: { '@path': '$.properties.address' }
          }
        },
        city: {
          '@if': {
            exists: { '@path': '$.traits.address.city' },
            then: { '@path': '$.traits.address.city' },
            else: { '@path': '$.properties.address.city' }
          }
        },
        country: {
          '@if': {
            exists: { '@path': '$.traits.address.country' },
            then: { '@path': '$.traits.address.country' },
            else: { '@path': '$.properties.address.country' }
          }
        },
        state: {
          '@if': {
            exists: { '@path': '$.traits.address.state' },
            then: { '@path': '$.traits.address.state' },
            else: { '@path': '$.properties.address.state' }
          }
        },
        postal_code: {
          '@if': {
            exists: { '@path': '$.traits.address.postal_code' },
            then: { '@path': '$.traits.address.postal_code' },
            else: { '@path': '$.properties.address.postal_code' }
          }
        },
        timezone: {
          '@if': {
            exists: { '@path': '$.traits.timezone' },
            then: { '@path': '$.traits.timezone' },
            else: { '@path': '$.properties.timezone' }
          }
        },
        birth_day: {
          '@if': {
            exists: { '@path': '$.traits.birth_day' },
            then: { '@path': '$.traits.birth_day' },
            else: { '@path': '$.properties.birth_day' }
          }
        },
        birth_month: {
          '@if': {
            exists: { '@path': '$.traits.birth_month' },
            then: { '@path': '$.traits.birth_month' },
            else: { '@path': '$.properties.birth_month' }
          }
        },
        birth_year: {
          '@if': {
            exists: { '@path': '$.traits.birth_year' },
            then: { '@path': '$.traits.birth_year' },
            else: { '@path': '$.properties.birth_year' }
          }
        },
        birth_date: {
          '@if': {
            exists: { '@path': '$.traits.birth_date' },
            then: { '@path': '$.traits.birth_date' },
            else: { '@path': '$.properties.birth_date' }
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
    email: {
      label: 'Email',
      description: 'The email address of the user.',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      } 
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
      description: 'The Segment event type (identify, alias, etc.)',
      type: 'string',
      required: true,
      default: {
        '@path': '$.type'
      }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Profiles',
      unsafe_hidden: true,
      description:
        'When enabled, Segment will batch profiles together and send them to StackAdapt in a single request.',
      required: true,
      default: true
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
    },
    marketing_status: {
      label: 'Marketing Status',
      description: 'In certain jurisdictions, explicit consent may be required to send email marketing communications to imported profiles. Consult independent counsel for further guidance.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Opted-in (Profiles can receive email marketing)', value: 'Opted-in' },
        { label: 'Indeterminate (Profiles that have not opted-out, but are excluded from email marketing)', value: 'Indeterminate' }
      ],
    }
  },
  perform: async (request, { payload, settings }) => {
    return await performForwardAudienceEvents(request, [payload], settings)
  },
  performBatch: async (request, { payload, settings }) => {
    return await performForwardAudienceEvents(request, payload, settings)
  }
}

export default action