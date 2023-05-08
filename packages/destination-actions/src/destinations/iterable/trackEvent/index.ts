import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import dayjs from '../../../lib/dayjs'
import {
  EMAIL_FIELD,
  USER_ID_FIELD,
  CREATED_AT_FIELD,
  CAMPAGIN_ID_FIELD,
  TEMPLATE_ID_FIELD,
  EVENT_DATA_FIELDS
} from '../shared-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event',
  description: 'Track a custom event to a user profile',
  defaultSubscription: 'type = "track" and event != "Order Completed" and event != "Update Cart"',
  fields: {
    email: {
      ...EMAIL_FIELD
    },
    userId: {
      ...USER_ID_FIELD
    },
    eventName: {
      label: 'Event name',
      description: 'Name of the event',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    dataFields: {
      ...EVENT_DATA_FIELDS
    },
    id: {
      label: 'Event ID',
      description: 'A unique ID. If an event exists with that id, the event will be updated',
      type: 'string',
      required: false,
      default: { '@path': '$.messageId' }
    },
    createdAt: {
      ...CREATED_AT_FIELD
    },
    campaignId: {
      ...CAMPAGIN_ID_FIELD
    },
    templateId: {
      ...TEMPLATE_ID_FIELD
    }
  },
  perform: (request, { payload }) => {
    if (!payload.email && !payload.userId) {
      throw new PayloadValidationError('Must include email or userId.')
    }

    interface TrackEventRequest {
      email?: string
      userId?: string
      eventName: string
      id?: string
      createdAt?: number
      dataFields?: {
        [k: string]: unknown
      }
      campaignId?: number
      templateId?: number
    }

    const trackEventRequest: TrackEventRequest = {
      ...payload,
      createdAt: dayjs(payload.createdAt).unix()
    }

    return request('https://api.iterable.com/api/events/track', {
      method: 'post',
      json: trackEventRequest
    })
  }
}

export default action
