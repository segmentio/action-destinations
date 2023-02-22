import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  getEvents,
  getFields,
  API_BASE,
  BufferBatchTriggerEvent,
  BufferBatchTriggerEventItem,
  TriggerEventData,
  TriggerEventApiPayload,
  TriggerEventsApiPayload
} from '../emarsys-helper'
import { IntegrationError } from '@segment/actions-core'
import { RetryableError } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Trigger Event',
  description:
    'Trigger an external event on the Emarsys platform to launch automation programs. Note: You can only pass objects to event_payload (no literals, no arrays).',
  fields: {
    eventid: {
      label: 'Id of the external event',
      description: 'The Id of the external event',
      type: 'integer',
      required: true,
      dynamic: true
    },
    key_field: {
      label: 'Key field',
      description: 'The field to use to find the contact',
      type: 'string',
      required: true,
      dynamic: true
    },
    key_value: {
      label: 'Key value',
      description: 'Value for the key field used to find the contact. E.g. the email address ',
      type: 'string',
      required: true,
      dynamic: false
    },
    event_payload: {
      label: 'Event payload',
      description:
        'A JSON object that will be passed to the Emarsys template engine and can be used for personalization',
      type: 'object',
      required: false,
      allowNull: true
    }
  },
  dynamicFields: {
    eventid: async (request) => {
      return getEvents(request)
    },
    key_field: async (request) => {
      return getFields(request)
    }
  },
  perform: async (request, data) => {
    if (!data?.payload?.key_field) throw new IntegrationError('Missing key field')

    if (!data?.payload?.key_value) throw new IntegrationError('Missing key value')

    data.payload.eventid = parseInt(data.payload.eventid.toString().replace(/[^0-9]/g, ''))

    if (data.payload.eventid > 0) {
      const payload: TriggerEventApiPayload = {
        key_id: data.payload.key_field,
        external_id: data.payload.key_value,
        data: <TriggerEventData>data.payload.event_payload ?? null
      }

      const response = await request(`${API_BASE}event/${data.payload.eventid}/trigger`, {
        method: 'post',
        json: payload,
        throwHttpErrors: false
      })

      switch (response?.status) {
        case 200:
          try {
            const body = await response.json()
            if (body.replyCode === 0) return response
            else throw new IntegrationError('Something went wrong while triggering the event')
          } catch (err) {
            throw new IntegrationError('Invalid JSON response')
          }
        case 400:
          throw new IntegrationError('The event could not be triggered')
        case 429:
          throw new RetryableError('Rate limit reached.')
        default:
          throw new RetryableError('There seems to be an API issue.')
      }
    } else {
      throw new IntegrationError('eventid must be >0')
    }
  },
  performBatch: async (request, data) => {
    if (data && data.payload && Array.isArray(data.payload)) {
      const batches: BufferBatchTriggerEvent = {}
      data.payload.forEach((payload: Payload) => {
        if (!batches[`${payload.eventid}-${payload.key_field}`]) {
          batches[`${payload.eventid}-${payload.key_field}`] = {
            event_id: payload.eventid,
            key_id: payload.key_field,
            keys: []
          }
        }
        batches[`${payload.eventid}-${payload.key_field}`].keys.push({
          external_id: payload.key_value,
          data: (payload.event_payload as TriggerEventData) ?? null
        })
      })

      const requests = []
      for (const key in batches) {
        const batch: BufferBatchTriggerEventItem = batches[key]
        const payload: TriggerEventsApiPayload = {
          key_id: batch.key_id,
          contacts: batch.keys
        }
        const response = request(`${API_BASE}event/${batch.event_id}/trigger`, {
          method: 'post',
          json: payload,
          throwHttpErrors: false
        })
        requests.push(response)
      }
      if (requests.length > 0) {
        return Promise.all(requests)
      }
    }
    return 0
  }
}

export default action
