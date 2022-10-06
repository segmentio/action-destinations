import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { key, id, keys, values, enable_batching } from '../sfmc-properties'
import { upsertRows } from '../sfmc-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Contact Data Extension',
  description: '',
  fields: {
    key: key,
    id: id,
    keys: {
      ...keys,
      properties: {
        contactKey: {
          label: 'Contact Key',
          description: 'TODO',
          type: 'string',
          required: true,
          default: { '@path': '$.userId' }
        }
      }
    },
    values: values,
    enable_batching: enable_batching
  },
  perform: async (request, { settings, payload }) => {
    return upsertRows(request, settings.subdomain, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return upsertRows(request, settings.subdomain, payload)
  }
}

export default action
