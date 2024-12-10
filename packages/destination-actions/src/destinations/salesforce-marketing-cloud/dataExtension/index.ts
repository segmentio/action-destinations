import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { key, id, keys, enable_batching, batch_size, values_dataExtensionFields } from '../sfmc-properties'
import { upsertRows } from '../sfmc-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event to Data Extension',
  description: 'Upsert events as rows into an existing data extension in Salesforce Marketing Cloud.',
  fields: {
    key: key,
    id: id,
    keys: { ...keys, required: true },
    values: values_dataExtensionFields,
    enable_batching: enable_batching,
    batch_size: batch_size
  },
  perform: async (request, { settings, payload }) => {
    return upsertRows(request, settings.subdomain, [payload])
  },
  performBatch: async (request, { settings, payload, statsContext, features }) => {
    if (features && features['enable-sfmc-id-key-stats']) {
      const statsClient = statsContext?.statsClient
      const tags = statsContext?.tags
      const setKey = new Set()
      const setId = new Set()
      payload.forEach((profile) => {
        if (profile.id != undefined && profile.id != null) {
          setId.add(profile.id)
        }
        if (profile.key != undefined && profile.key != null) {
          setKey.add(profile.key)
        }
      })
      statsClient?.histogram(`sfmc_id`, setId.size, tags)
      statsClient?.histogram(`sfmc_key`, setKey.size, tags)
    }
    return upsertRows(request, settings.subdomain, payload)
  }
}

export default action
