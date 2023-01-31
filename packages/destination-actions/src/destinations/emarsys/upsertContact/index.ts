import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  getFields,
  API_BASE,
  ContactData,
  ContactsApiPayload,
  BufferBatchContacts,
  BufferBatchContactItem
} from '../emarsys-helper'
import { IntegrationError } from '@segment/actions-core'
import { RetryableError } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: '',
  fields: {
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
    write_field: {
      label: 'Fields to write',
      description:
        'Use the emarsys field id (number) as key and set a value (string) (static, function or event variable)',
      type: 'object',
      required: true
    }
  },
  dynamicFields: {
    key_field: async (request) => {
      return getFields(request)
    }
  },
  perform: async (request, data) => {
    let contact: ContactData = {}
    if (
      data.payload.key_field &&
      data.payload.key_field != '' &&
      data.payload.key_value &&
      data.payload.key_value != ''
    ) {
      contact[data.payload.key_field] = data.payload.key_value
      contact = Object.assign(contact, data.payload.write_field)
      const payload: ContactsApiPayload = {
        key_id: data.payload.key_field,
        contacts: [contact]
      }
      const response = await request(`${API_BASE}contact/?create_if_not_exists=1`, {
        method: 'put',
        json: payload,
        throwHttpErrors: false
      })

      if (response && response.status && response.status == 200) {
        try {
          if (response.content != '') {
            const body = await response.json()
            if (body.replyCode !== undefined && body.replyCode == 0) {
              return response
            } else {
              throw new IntegrationError('Something went wront while triggering the event')
            }
          } else {
            return response // required to return the empty response for snapshot testing.
          }
        } catch (err) {
          throw new IntegrationError('Invalid JSON response')
        }
      } else if (response.status == 400) {
        throw new IntegrationError('Contact could not be upserted')
      } else if (response.status == 429) {
        throw new RetryableError('Rate limit reached.')
      } else {
        throw new RetryableError('There seems to be an API issue.')
      }
    } else {
      throw new IntegrationError('Missing key values')
    }
  },
  performBatch: async (request, data) => {
    if (data && data.payload && Array.isArray(data.payload)) {
      const batches: BufferBatchContacts = {}
      data.payload.forEach((payload: Payload) => {
        if (!batches[`${payload.key_field}`]) {
          batches[`${payload.key_field}`] = {
            key_id: payload.key_field,
            contacts: []
          }
        }
        let contact: ContactData = {}
        contact[payload.key_field] = payload.key_value
        contact = Object.assign(contact, payload.write_field)
        batches[`${payload.key_field}`].contacts.push(contact)
      })

      for (const key in batches) {
        const batch: BufferBatchContactItem = batches[key]
        const payload: ContactsApiPayload = {
          key_id: batch.key_id,
          contacts: batch.contacts
        }
        const response = await request(`${API_BASE}contact/?create_if_not_exists=1`, {
          method: 'put',
          json: payload,
          throwHttpErrors: false
        })

        if (response && response.status && response.status == 200) {
          // proceed with sending the next API batch
        } else if (response && response.status && response.status == 400) {
          // proceed with the next API-batch-request even there is a problem with the sent data of the current API-batch-request
        } else if (response && response.status && response.status == 429) {
          throw new RetryableError('Rate limit reached.')
        } else {
          throw new RetryableError('There seems to be an API issue.')
        }
      }
    }
  }
}

export default action
