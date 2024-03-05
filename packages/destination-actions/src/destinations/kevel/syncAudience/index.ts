import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description:
    "Sync a Segment Engage Audience to a Kevel UserDB Interest. Only users with a Segment userId will be synced. See Kevel's [documentation for more details](https://dev.kevel.com/reference/add-interest-to-user).",
  defaultSubscription: 'type = "track" or type = "identify"',
  fields: {
    segment_computation_key: {
      label: 'Audience Key',
      description: 'Segment Audience name to which user identifier should be added or removed',
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
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
    },
    segment_user_id: {
      label: 'User ID',
      description: "The user's unique ID",
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: { '@path': '$.userId' }
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
    }
  },
  perform: async (request, data) => {
    const settings = data.settings

    const baseUrl = `https://e-${settings.networkId}.adzerk.net/udb/${settings.networkId}`

    const payload = data.payload

    const audienceValue = payload.traits_or_props[payload.segment_computation_key]

    return request(`${baseUrl}/interests?userKey=${payload.segment_user_id}`, {
      json: [payload.segment_computation_key],
      method: audienceValue ? 'POST' : 'DELETE'
    })
  }
}

export default action
