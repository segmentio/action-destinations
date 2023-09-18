import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { key, id, keys, enable_batching, batch_size, values_contactFields } from '../sfmc-properties'
import { upsertRows } from '../sfmc-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Contact to Data Extension',
  defaultSubscription: 'type = "identify"',
  description: 'Upsert contact data as rows into an existing data extension in Salesforce Marketing Cloud.',
  fields: {
    key: key,
    id: id,
    keys: {
      ...keys,
      properties: {
        contactKey: {
          label: 'Contact Key',
          description:
            'The unique identifier that you assign to a contact. Contact Key must be a Primary Key in the data extension that contains contact information.',
          type: 'string',
          required: true
        }
      },
      default: {
        contactKey: { '@path': '$.userId' }
      }
    },
    values: values_contactFields,
    enable_batching: enable_batching,
    batch_size: batch_size
  },
  perform: async (request, { settings, payload, statsContext }) => {
    return upsertRows(request, settings.subdomain, [payload], statsContext)
  },
  performBatch: async (request, { settings, payload, statsContext }) => {
    return upsertRows(request, settings.subdomain, payload, statsContext)
  }
}

export default action
