import { ActionDefinition } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { performForwardProfiles } from './functions'
import { advertiserIdFieldImplementation } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward Profile',
  description: 'Forward new or updated user profile to StackAdapt',
  defaultSubscription: 'type = "identify" or type = "alias" or type = "track"',
  fields: {
    traits: {
      label: 'User Properties',
      type: 'object',
      description: 'The properties of the user.',
      defaultObjectUI: 'keyvalue',
      additionalProperties: true,
      required: false,
      properties: {
        email: {
          label: 'Email',
          type: 'string',
          description: 'The email address of the user.'
        },
        firstName: {
          label: 'First Name',
          type: 'string',
          description: "The user's first name."
        },
        lastName: {
          label: 'Last Name',
          type: 'string',
          description: "The user's last name."
        },
        phone: {
          label: 'Phone',
          type: 'string',
          description: 'The phone number of the user.'
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
        postalCode: {
          label: 'Postal Code',
          type: 'string',
          description: 'The postal code of the user.'
        },
        birthday: {
          label: 'Birthday',
          type: 'string',
          description: 'The birthday of the user.'
        }
      },
      default: {
        email: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.context.traits.email' }
          }
        },
        firstName: {
          '@if': {
            exists: { '@path': '$.traits.first_name' },
            then: { '@path': '$.traits.first_name' },
            else: { '@path': '$.context.traits.first_name' }
          }
        },
        lastName: {
          '@if': {
            exists: { '@path': '$.traits.last_name' },
            then: { '@path': '$.traits.last_name' },
            else: { '@path': '$.context.traits.last_name' }
          }
        },
        phone: {
          '@if': {
            exists: { '@path': '$.traits.phone' },
            then: { '@path': '$.traits.phone' },
            else: { '@path': '$.context.traits.phone' }
          }
        },
        city: {
          '@if': {
            exists: { '@path': '$.traits.address.city' },
            then: { '@path': '$.traits.address.city' },
            else: { '@path': '$.context.traits.address.city' }
          }
        },
        country: {
          '@if': {
            exists: { '@path': '$.traits.address.country' },
            then: { '@path': '$.traits.address.country' },
            else: { '@path': '$.context.traits.address.country' }
          }
        },
        state: {
          '@if': {
            exists: { '@path': '$.traits.address.state' },
            then: { '@path': '$.traits.address.state' },
            else: { '@path': '$.context.traits.address.state' }
          }
        },
        postalCode: {
          '@if': {
            exists: { '@path': '$.traits.address.postalCode' },
            then: { '@path': '$.traits.address.postalCode' },
            else: { '@path': '$.context.traits.address.postalCode' }
          }
        },
        birthday: {
          '@if': {
            exists: { '@path': '$.traits.birthday' },
            then: { '@path': '$.traits.birthday' },
            else: { '@path': '$.context.traits.birthday' }
          }
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
    previous_id: {
      label: 'Previous ID',
      type: 'string',
      description: "The user's previous ID, for alias events",
      default: {
        '@path': '$.previousId'
      }
    },
    event_type: {
      label: 'Event Type',
      description: 'The Segment event type (identify, alias, etc.)',
      type: 'string',
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
    advertiser_id: {
      label: 'Advertiser',
      description: 'The StackAdapt advertiser to add the profile to.',
      type: 'string',
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      required: true,
      dynamic: true
    }
  },
  dynamicFields: {
    advertiser_id: advertiserIdFieldImplementation
  },
  perform: async (request, { payload }) => {
    return await performForwardProfiles(request, [payload])
  },
  performBatch: async (request, { payload }) => {
    return await performForwardProfiles(request, payload)
  }
}

export default action
