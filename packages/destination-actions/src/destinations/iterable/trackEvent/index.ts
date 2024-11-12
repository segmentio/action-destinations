import { ActionDefinition, PayloadValidationError, DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import dayjs from '../../../lib/dayjs'
import {
  EMAIL_FIELD,
  USER_ID_FIELD,
  CREATED_AT_FIELD,
  CAMPAGIN_ID_FIELD,
  TEMPLATE_ID_FIELD,
  EVENT_DATA_FIELDS,
  DataCenterLocation
} from '../shared-fields'
import { convertDatesInObject, getRegionalEndpoint } from '../utils'

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

interface BulkTrackEventRequest {
  events: TrackEventRequest[]
}

const transformIterableEventPayload = (payload: Payload): TrackEventRequest => {
  const formattedDataFields = convertDatesInObject(payload.dataFields ?? {})
  return {
    ...payload,
    dataFields: formattedDataFields,
    createdAt: dayjs(payload.createdAt).unix()
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event',
  description: 'Track a custom event to a user profile',
  defaultSubscription: 'type = "track" and event != "Order Completed" and event != "Cart Updated"',
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
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'When enabled, Segment will send data to Iterable in batches of up to 1001',
      type: 'boolean',
      required: false,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 1001
    }
  },
  perform: (request, { payload, settings }) => {
    if (!payload.email && !payload.userId) {
      throw new PayloadValidationError('Must include email or userId.')
    }

    const trackEventRequest = transformIterableEventPayload(payload)

    const endpoint = getRegionalEndpoint('trackEvent', settings.dataCenterLocation as DataCenterLocation)

    return request(endpoint, {
      method: 'post',
      json: trackEventRequest,
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    })
  },
  performBatch: async (request, { settings, payload }) => {
    const bulkTrackEventRequest: BulkTrackEventRequest = {
      events: payload.map(transformIterableEventPayload)
    }

    const endpoint = getRegionalEndpoint('bulkTrackEvent', settings.dataCenterLocation as DataCenterLocation)

    return request(endpoint, {
      method: 'post',
      json: bulkTrackEventRequest,
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    })
  }
}

export default action
