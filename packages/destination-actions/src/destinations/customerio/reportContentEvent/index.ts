import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendBatch, sendSingle } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Content Event',
  description: 'Report a Viewed or Clicked Content event.',
  defaultSubscription: 'event = "Report Content Event"',
  fields: {
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'ID for the anonymous user.',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    actionType: {
      label: 'Action Type',
      description: 'The type of content event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.actionType'
      },
      choices: [
        { label: 'Viewed', value: 'viewed_content' },
        { label: 'Clicked', value: 'clicked_content' }
      ]
    },
    timestamp: {
      label: 'Timestamp',
      description: 'A timestamp of when the event took place. Default is current date and time.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    data: {
      label: 'Event Attributes',
      description: 'Optional data to include with the event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    convert_timestamp: {
      label: 'Convert Timestamps',
      description: 'Convert dates to Unix timestamps (seconds since Epoch).',
      type: 'boolean',
      default: true
    },
  },
  performBatch: (request, { payload: payloads, settings }) => {
    return sendBatch(
      request,
      payloads.map((payload) => ({
        action: payload.actionType,
        payload: mapPayload(payload),
        settings,
        type: 'person'
      }))
    )
  },

  perform: (request, { payload, settings }) => {
    return sendSingle(request, { action: payload.actionType, payload: mapPayload(payload), settings, type: 'person' })
  }
}

function mapPayload(payload: Payload) {
  const { actionType, data, ...rest } = payload

  if (data?.actionType) {
    delete data.actionType
  }

  return {
    ...rest,
    name: actionType,
    attributes: data
  }
}

export default action
