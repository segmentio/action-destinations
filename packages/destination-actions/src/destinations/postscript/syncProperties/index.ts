import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Properties or Audiences',
  description: 'Sync custom properties and Engage Audience to Postscript',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_audience_id: {
      label: 'Audience ID',
      description: 'Segment Audience ID to which user identifier should be added or removed',
      type: 'string',
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Segment Audience key to which user identifier should be added or removed',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description:
        "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
      type: 'string',
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_class'
      }, 
      required: true, 
      choices: [
        { value: 'audience', label: 'audience' }
      ]
    },
    email: {
      label: 'Email address',
      description: "The user's email address. Required if phone is not provided.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    phone: {
      label: 'Phone',
      description: "The user's phone number. Required if email is not provided.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      }
    },
    traits_or_props: {
      label: 'Traits or properties object',
      description: 'A computed object for track and identify events. This field should not need to be edited.',
      type: 'object',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    }
  },
  perform: async (request, {payload}) => {
    
    const { email, phone } = payload

    if(!email && !phone) {
      throw new PayloadValidationError("Either email or phone is required")
    }

    const audienceAction = payload.traits_or_props[payload.segment_audience_key]

    const json = payload

    const userId = await request('https://webhook.site/4822ddc0-5b2b-4ef0-b504-9a5ee1d8c457', {
      method: 'post',
      json
    })

    console.log(userId)

  }
}

export default action
