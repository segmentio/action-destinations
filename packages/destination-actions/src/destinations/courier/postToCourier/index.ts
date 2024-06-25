import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getDomain } from '..'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward to Courier',
  description: 'Forward track, group and identify events to Courier',
  defaultSubscription: `type = "track" or type = "identify" or type = "group"`,
  fields: {
    data: {
      label: 'Payload',
      description: 'All payload data',
      type: 'object',
      required: true,
      default: { '@path': '$.' },
      unsafe_hidden: true
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description: "Segment computation class used to determine if input event is from an Engage Audience'",
      type: 'string',
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_class'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    if (payload?.segment_computation_action === 'audience') {
      throw new PayloadValidationError(
        'This Action does not support sending Engage Audiences. Please use the Sync Audience Action.'
      )
    }

    if (!['track', 'group', 'identify'].includes(payload.data.type as string)) {
      throw new PayloadValidationError('Event type must be either track, group or identify')
    }

    const domain = getDomain(settings.region)

    return request(`${domain}/inbound/segment`, {
      method: 'POST',
      json: payload.data
    })
  }
}

export default action
