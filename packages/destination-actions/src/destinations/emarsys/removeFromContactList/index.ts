import { APIError, PayloadValidationError, RetryableError, ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  getContactLists,
  getFields,
  API_BASE,
  ContactListApiPayload,
  BufferBatchContactList,
  BufferBatchContactListItem
} from '../emarsys-helper'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove from Contact List',
  description: 'Remove a contact from a contact list.',
  fields: {
    contactlistid: {
      label: 'Id of the contact list',
      description: 'The Id of the contactlist',
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
      description: 'Value for the key field used to find the contact. E.g. the email address  ',
      type: 'string',
      required: true,
      dynamic: false
    }
  },
  dynamicFields: {
    contactlistid: async (request) => {
      return getContactLists(request)
    },
    key_field: async (request) => {
      return getFields(request)
    }
  },
  perform: async (request, data) => {
    data.payload.contactlistid = parseInt(data.payload.contactlistid.toString().replace(/[^0-9]/g, ''))

    if (data.payload.contactlistid > 0) {
      const payload: ContactListApiPayload = {
        contactlistid: data.payload.contactlistid,
        key_id: data.payload.key_field,
        external_ids: [data.payload.key_value]
      }

      const response = await request(`${API_BASE}contactlist/${data.payload.contactlistid}/delete`, {
        method: 'post',
        json: payload,
        throwHttpErrors: false
      })

      switch (response?.status) {
        case 200:
          try {
            const body = await response.json()
            if (body.replyCode === 0) return response
            else
              throw new APIError(
                `Something went wrong while removing from contact list: ${body?.replyText ?? 'UNKNOWN'}`,
                500
              )
          } catch (err) {
            throw new APIError('Invalid JSON response', 400)
          }
        case 400:
          throw new APIError('The contact could not be removed from the contact list', 400)
        case 429:
          throw new RetryableError('Rate limit reached.')
        default:
          throw new RetryableError('There seems to be an API issue.')
      }
    } else {
      throw new PayloadValidationError('ContactlistId must be >0')
    }
  },
  performBatch: async (request, data) => {
    if (data && data.payload && Array.isArray(data.payload)) {
      const batches: BufferBatchContactList = {}
      data.payload.forEach((payload: Payload) => {
        if (!batches[`${payload.contactlistid}-${payload.key_field}`]) {
          batches[`${payload.contactlistid}-${payload.key_field}`] = {
            contactlistid: payload.contactlistid,
            key_id: payload.key_field,
            external_ids: []
          }
        }
        batches[`${payload.contactlistid}-${payload.key_field}`].external_ids.push(payload.key_value)
      })

      const requests = []
      for (const key in batches) {
        const batch: BufferBatchContactListItem = batches[key]
        const payload: ContactListApiPayload = {
          key_id: batch.key_id,
          external_ids: batch.external_ids
        }
        const response = request(`${API_BASE}contactlist/${batch.contactlistid}/delete`, {
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
