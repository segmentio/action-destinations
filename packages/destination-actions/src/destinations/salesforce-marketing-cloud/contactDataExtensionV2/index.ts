import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { keys, enable_batching, batch_size, values_contactFields, dataExtensionHook } from '../sfmc-properties'
import { executeUpsertWithMultiStatus, getDataExtensionFields, upsertRowsV2 } from '../sfmc-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Contact to Data Extension',
  defaultSubscription: 'type = "identify"',
  description: 'Upsert contact data as rows into an existing data extension in Salesforce Marketing Cloud.',
  fields: {
    keys: {
      ...keys,
      dynamic: true,
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
    values: { ...values_contactFields, dynamic: true },
    enable_batching: enable_batching,
    batch_size: batch_size
  },
  dynamicFields: {
    keys: {
      __keys__: async (request, { settings, payload }) => {
        const dataExtensionId =
          (payload as any).onMappingSave?.outputs.id || (payload as any).retlOnMappingSave?.outputs?.id || ''
        return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, true)
      }
    },
    values: {
      __keys__: async (request, { settings, payload }) => {
        const dataExtensionId =
          (payload as any).onMappingSave?.outputs?.id || (payload as any).retlOnMappingSave?.outputs?.id || ''
        return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, false)
      }
    }
  },
  hooks: {
    retlOnMappingSave: {
      ...dataExtensionHook
    },
    onMappingSave: {
      ...dataExtensionHook
    }
  },
  perform: async (request, { settings, payload, hookOutputs }) => {
    const dataExtensionId = hookOutputs?.onMappingSave?.outputs?.id || hookOutputs?.retlOnMappingSave?.outputs?.id

    return upsertRowsV2(request, settings.subdomain, [payload], dataExtensionId)
  },
  performBatch: async (request, { settings, payload, hookOutputs }) => {
    const dataExtensionId = hookOutputs?.onMappingSave?.outputs?.id || hookOutputs?.retlOnMappingSave?.outputs?.id

    return executeUpsertWithMultiStatus(request, settings.subdomain, payload, dataExtensionId)
  }
}

export default action
