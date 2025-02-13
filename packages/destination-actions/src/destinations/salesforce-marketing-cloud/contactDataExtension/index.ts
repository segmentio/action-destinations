import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  key,
  id,
  keys,
  enable_batching,
  batch_size,
  values_contactFields,
  categoryId,
  name,
  description,
  columns,
  operation,
  dataExtensionKey,
  dataExtensionId
} from '../sfmc-properties'
import {
  executeUpsertWithMultiStatus,
  upsertRows,
  selectOrCreateDataExtension,
  getDataExtensions,
  getDataExtensionFields
} from '../sfmc-operations'

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
  dynamicFields: {
    keys: {
      __keys__: async (request, { settings, payload }) => {
        const dataExtensionId = (payload as any)?.onMappingSave?.outputs.id || payload.id || ''
        return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId)
      }
    }
  },
  hooks: {
    onMappingSave: {
      label: 'Create Data Extension',
      description: 'Create a new data extension in Salesforce Marketing Cloud.',
      inputFields: {
        operation,
        dataExtensionKey,
        dataExtensionId: {
          ...dataExtensionId,
          dynamic: async (request, { dynamicFieldContext, settings }) => {
            const query = dynamicFieldContext?.query
            return await getDataExtensions(request, settings.subdomain, settings, query)
          }
        },
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
