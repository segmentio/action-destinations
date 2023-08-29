import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Data } from './types'
import { getUpsertURL } from '../helpers'
import { hashAndEncode } from '../helpers'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync Segment Engage Audiences to Dynamic Yield',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Segment Audience key / name',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description:
        "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
    },
    segment_user_id: {
      label: 'Segment User ID',
      description: 'The Segment userId value.',
      type: 'hidden',
      required: false,
      default: { '@path': '$.userId' }
    },
    segment_anonymous_id: {
      label: 'Segment Anonymous ID',
      description: 'The Segment anonymousId value.',
      type: 'hidden',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    user_email: {
      label: 'Email address',
      description: "The user's email address",
      type: 'hidden',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    }
  },

  perform: async (request, data) => {
    const d = data as Data
    const payload = data.payload
    const settings = data.settings
    const audienceName = payload.segment_audience_key
    const audienceValue = d?.rawData?.properties?.[audienceName] ?? d?.rawData?.traits?.[audienceName]

    const URL = getUpsertURL(settings)
    return request(URL, {
      method: 'post',
      json: {
        audienceValue,
        audienceName,
        identifier: payload.segment_user_id ?? payload.segment_anonymous_id,
        email: payload.user_email ? hashAndEncode(payload.user_email) : undefined,
        sectionId: settings.sectionId,
        dataCenter: settings.dataCenter
      }
    })
  }
}

export default action
