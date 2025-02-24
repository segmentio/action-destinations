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
  dataExtensionId
} from '../sfmc-properties'
import {
  executeUpsertWithMultiStatus,
  upsertRows,
  selectOrCreateDataExtension,
  getDataExtensions,
  getDataExtensionFields,
  getCategories
} from '../sfmc-operations'

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
  dynamicFields: {
    keys: {
      __keys__: async (request, { settings, hookOutputs, payload }) => {
        const dataExtensionId =
          hookOutputs?.onMappingSave?.outputs.id || (payload as any).onMappingSave.outputs.id || ''
        return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, true)
      }
    },
    values: {
      __keys__: async (request, { settings, hookOutputs, payload }) => {
        const dataExtensionId =
          hookOutputs?.onMappingSave?.outputs.id || (payload as any).onMappingSave.outputs.id || ''
        return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, true)
      }
    }
  },
  hooks: {
    onMappingSave: {
      label: 'Create or Select Data Extension',
      description: 'Connect to an existing data extension or create a new one in Salesforce Marketing Cloud.',
      inputFields: {
        operation,
        dataExtensionId: {
          ...dataExtensionId,
          dynamic: async (request, { dynamicFieldContext, settings }) => {
            const query = dynamicFieldContext?.query
            return await getDataExtensions(request, settings.subdomain, settings, query)
          }
        },
        categoryId: {
          ...categoryId,
          dynamic: async (request, { settings }) => {
            return await getCategories(request, settings)
          }
        },
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
  perform: async (request, { settings, payload, hookOutputs }) => {
    const dataExtensionId = hookOutputs?.onMappingSave?.outputs.id || payload.id
    const deprecated_dataExtensionKey = payload.key

    return upsertRows(request, settings.subdomain, [payload], dataExtensionId, deprecated_dataExtensionKey)
  },
  performBatch: async (request, { settings, payload, hookOutputs }) => {
    const dataExtensionId = hookOutputs?.onMappingSave?.outputs.id || payload[0].id
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
