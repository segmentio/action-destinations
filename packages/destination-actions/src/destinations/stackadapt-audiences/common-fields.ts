import { InputField } from '@segment/actions-core'

export const common_fields: Record<string, InputField> = {
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
        birth_day: {
          label: 'Birth Day',
          type: 'number',
          description: 'The numeric birth day of the user. e.g 15 for the 15th of the month.',
          maximum: 31,
          minimum: 1
        },
        birth_month: {
          label: 'Birth Month',
          type: 'number',
          description: 'The numeric birth month of the user. e.g 6 for June.',
          maximum: 12,
          minimum: 1
        },
        birth_year: {
          label: 'Birth Year',
          type: 'number',
          description: 'The numeric birth year of the user. e.g 1990.'
        },
        birth_date: {
          label: 'Birth Date',
          type: 'string',
          format: 'date',
          description: "The birth date of the user in YYYY-MM-DD format. If set, overrides 'Birth Day', 'Birth Month' and 'Birth Year' fields."
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