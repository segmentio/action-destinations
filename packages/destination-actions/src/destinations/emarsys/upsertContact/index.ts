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
  description: 'Insert or update a contact on the Emarsys platform',
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
      required: true,
      properties: {
        1: {
          label: 'Given name',
          type: 'string'
        },
        2: {
          label: 'Last name',
          type: 'string'
        },
        3: {
          label: 'Email',
          type: 'string'
        }
      },
      default: {
        1: { '@path': '$.traits.firstName' },
        2: { '@path': '$.traits.lastName' },
        3: { '@path': '$.traits.email' }
      }
    }
  },
  dynamicFields: {
    key_field: async (request) => {
      return getFields(request)
    }
  },
  perform: async (request, data) => {
    const contact: ContactData = {}
    if (!data?.payload?.key_field) throw new IntegrationError('Missing key field')

    if (!data?.payload?.key_value) throw new IntegrationError('Missing key value')

    contact[data.payload.key_field] = data.payload.key_value
    Object.assign(contact, data.payload.write_field)
    const payload: ContactsApiPayload = {
      key_id: data.payload.key_field,
      contacts: [contact]
    }
    const response = await request(`${API_BASE}contact/?create_if_not_exists=1`, {
      method: 'put',
      json: payload,
      throwHttpErrors: false
    })

    switch (response?.status) {
      case 200:
        try {
          const body = await response.json()
          if (body.replyCode === 0) return response
          else throw new IntegrationError('Something went wrong while upserting the contact')
        } catch (err) {
          throw new IntegrationError('Invalid JSON response')
        }
      case 400:
        throw new IntegrationError('Contact could not be upserted')
      case 429:
        throw new RetryableError('Rate limit reached.')
      default:
        throw new RetryableError('There seems to be an API issue.')
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

      const requests = []
      for (const key in batches) {
        const batch: BufferBatchContactItem = batches[key]
        const payload: ContactsApiPayload = {
          key_id: batch.key_id,
          contacts: batch.contacts
        }
        const response = request(`${API_BASE}contact/?create_if_not_exists=1`, {
          method: 'put',
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
