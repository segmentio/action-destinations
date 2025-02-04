import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  key,
  id,
  keys,
  enable_batching,
  batch_size,
  values_dataExtensionFields,
  categoryId,
  name,
  description,
  columns,
  operation,
  dataExtensionKey,
  dataExtensionId
} from '../sfmc-properties'
import { executeUpsertWithMultiStatus, upsertRows, selectOrCreateDataExtension } from '../sfmc-operations'

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
  hooks: {
    onMappingSave: {
      label: 'Create Data Extension',
      description: 'Create a new data extension in Salesforce Marketing Cloud.',
      inputFields: {
        operation,
        dataExtensionKey,
        dataExtensionId,
        categoryId,
        name,
        description,
        columns
      },
      outputTypes: {
        id: {
          label: 'Data Extension ID',
          description: 'The identifier for the data extension.',
          type: 'string',
          required: true
        },
        name: {
          label: 'Data Extension Name',
          description: 'The name of the data extension.',
          type: 'string',
          required: true
        }
      },
      performHook: async (request, { settings, hookInputs }) => {
        return await selectOrCreateDataExtension(request, settings.subdomain, hookInputs, settings)
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    const dataExtensionId = 'todo: pull from hook outputs'
    const deprecated_dataExtensionKey = payload.key

    return upsertRows(request, settings.subdomain, [payload], dataExtensionId, deprecated_dataExtensionKey)
  },
  performBatch: async (request, { settings, payload }) => {
    const dataExtensionId = 'todo: pull from hook outputs'
    const deprecated_dataExtensionKey = payload[0].key

    return executeUpsertWithMultiStatus(
      request,
      settings.subdomain,
      payload,
      dataExtensionId,
      deprecated_dataExtensionKey
    )
  }
}

export default action
