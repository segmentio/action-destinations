import { IntegrationError, ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { keys, enable_batching, batch_size, values_contactFields, dataExtensionHook } from '../sfmc-properties'
import { getDataExtensionFields, insertRowsAsync } from '../sfmc-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Contact to Data Extension (V2 Async)',
  defaultSubscription: 'type = "identify"',
  description:
    'Asynchronously upsert contact data as rows into an existing data extension in Salesforce Marketing Cloud using the async API.',
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
    enable_batching: {
      ...enable_batching,
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      ...batch_size,
      default: 10000,
      unsafe_hidden: true
    }
  },
  dynamicFields: {
    keys: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      __keys__: async (request: any, { settings, payload }: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const dataExtensionId = payload.onMappingSave?.outputs?.id || payload.retlOnMappingSave?.outputs?.id || ''
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, true)
      }
    },
    values: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      __keys__: async (request: any, { settings, payload }: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const dataExtensionId = payload.onMappingSave?.outputs?.id || payload.retlOnMappingSave?.outputs?.id || ''
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
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

  // This perform method is required but won't be used since this action only supports batch operations
  perform: async () => {
    throw new IntegrationError(
      'This action only supports batch operations. Use performBatch instead.',
      'INVALID_REQUEST',
      400
    )
  },

  performBatch: async (request, { settings, payload, hookOutputs }) => {
    console.log('async called')
    const dataExtensionId: string =
      hookOutputs?.onMappingSave?.outputs?.id || hookOutputs?.retlOnMappingSave?.outputs?.id

    console.log('async perform batch called', dataExtensionId)

    if (!dataExtensionId) {
      throw new IntegrationError('Data Extension ID is required', 'INVALID_CONFIGURATION', 400)
    }

    return await insertRowsAsync(request, settings.subdomain, payload, dataExtensionId, settings)
  }
}

export default action
