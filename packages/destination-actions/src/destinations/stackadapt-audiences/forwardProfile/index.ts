import { ActionDefinition } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { performForwardProfiles } from './functions'
import { advertiserIdFieldImplementation } from '../functions'
import { getDefaultMappings, getFieldProperties } from '../profile-fields'

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
      properties: getFieldProperties(),
      default: getDefaultMappings()
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
