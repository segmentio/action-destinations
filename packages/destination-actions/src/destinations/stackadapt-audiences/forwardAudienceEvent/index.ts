import { ActionDefinition } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { performForwardAudienceEvents } from './functions'
import { advertiserIdFieldImplementation } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward Audience Event',
  description: 'Forward audience enter or exit events to StackAdapt',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    traits_or_props: {
      label: 'Event Properties',
      type: 'object',
      description: 'The properties of the user or event.',
      unsafe_hidden: true,
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties.audience_key' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
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
      description: "Segment computation class used to determine if input event is from an Engage Audience'.",
      type: 'string',
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_class'
      }
    },
    segment_computation_id: {
      label: 'Segment Computation ID',
      description: 'For audience enter/exit events, this will be the audience ID.',
      type: 'string',
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
    return await performForwardAudienceEvents(request, [payload])
  },
  performBatch: async (request, { payload }) => {
    return await performForwardAudienceEvents(request, payload)
  }
}

export default action
