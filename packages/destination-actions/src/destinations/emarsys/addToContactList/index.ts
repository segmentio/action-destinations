import { IntegrationError, RetryableError } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
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
  title: 'Add to Contact List',
  description: 'Add a contact to a contact list. The contact must exist before it can be added.',
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
    if (!data?.payload?.key_field) throw new IntegrationError('Missing key field')

    if (!data?.payload?.key_value) throw new IntegrationError('Missing key value')

    data.payload.contactlistid = parseInt(data.payload.contactlistid.toString().replace(/[^0-9]/g, ''))

    if (data.payload.contactlistid > 0) {
      const payload: ContactListApiPayload = {
        key_id: data.payload.key_field,
        external_ids: [data.payload.key_value]
      }
      const response = await request(`${API_BASE}contactlist/${data.payload.contactlistid}/add`, {
        method: 'post',
        json: payload,
        throwHttpErrors: false
      })

      switch (response?.status) {
        case 200:
          try {
            const body = await response.json()
            if (body.replyCode === 0) return response
            else throw new IntegrationError('Something went wrong while adding to contact list')
          } catch (err) {
            throw new IntegrationError('Invalid JSON response')
          }
        case 400:
          throw new IntegrationError('The contact could not be removed from the contact list')
        case 429:
          throw new RetryableError('Rate limit reached.')
        default:
          throw new RetryableError('There seems to be an API issue.')
      }
    } else {
      throw new IntegrationError('ContactlistId must be >0')
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
        if (payload.key_value && payload.key_value != '') {
          batches[`${payload.contactlistid}-${payload.key_field}`].external_ids.push(payload.key_value)
        }
      })

      const requests = []
      for (const key in batches) {
        const batch: BufferBatchContactListItem = batches[key]
        const payload: ContactListApiPayload = {
          key_id: batch.key_id,
          external_ids: batch.external_ids
        }
        const response = request(`${API_BASE}contactlist/${batch.contactlistid}/add`, {
          method: 'post',
          json: payload,
          throwHttpErrors: true
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
