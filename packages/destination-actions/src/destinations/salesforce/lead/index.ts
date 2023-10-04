import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  bulkUpdateRecordId,
  bulkUpsertExternalId,
  customFields,
  operation,
  traits,
  validateLookup,
  enable_batching,
  recordMatcherOperator,
  batch_size
} from '../sf-properties'
import Salesforce from '../sf-operations'
import { ActionHookResponse } from '@segment/actions-core/src/destination-kit/action'
import { ActionHookError } from '@segment/actions-core/src/destination-kit/action'

const OBJECT_NAME = 'Lead'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Lead',
  description: 'Create, update, or upsert leads in Salesforce.',
  defaultSubscription: 'type = "identify"',
  fields: {
    operation: operation,
    recordMatcherOperator: recordMatcherOperator,
    enable_batching: enable_batching,
    batch_size: batch_size,
    traits: traits,
    bulkUpsertExternalId: bulkUpsertExternalId,
    bulkUpdateRecordId: bulkUpdateRecordId,
    company: {
      label: 'Company',
      description: "The lead's company. **This is required to create a lead.**",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.company' },
          then: { '@path': '$.traits.company' },
          else: { '@path': '$.properties.company' }
        }
      }
    },
    last_name: {
      label: 'Last Name',
      description: "The lead's last name. **This is required to create a lead.**",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      }
    },
    first_name: {
      label: 'First Name',
      description: "The lead's first name.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      }
    },
    email: {
      label: 'Email',
      description: "The lead's email address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    city: {
      label: 'City',
      description: "City for the lead's address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.city' },
          then: { '@path': '$.traits.address.city' },
          else: { '@path': '$.properties.address.city' }
        }
      }
    },
    postal_code: {
      label: 'Postal Code',
      description: "Postal code for the lead's address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.postal_code' },
          then: { '@path': '$.traits.address.postal_code' },
          else: { '@path': '$.properties.address.postal_code' }
        }
      }
    },
    country: {
      label: 'Country',
      description: "Country for the lead's address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.country' },
          then: { '@path': '$.traits.address.country' },
          else: { '@path': '$.properties.address.country' }
        }
      }
    },
    street: {
      label: 'Street',
      description: "Street number and name for the lead's address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.street' },
          then: { '@path': '$.traits.address.street' },
          else: { '@path': '$.properties.address.street' }
        }
      }
    },
    state: {
      label: 'State',
      description: "State for the lead's address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.state' },
          then: { '@path': '$.traits.address.state' },
          else: { '@path': '$.properties.address.state' }
        }
      }
    },
    customFields: customFields
  },
  hooks: {
    'on-subscription-save': {
      label: 'Create a Lead record, just to demo things',
      description:
        'This implementation of the on-subscription-save hook will create a new Lead record in Salesforce. It will then save the ID of the newly created record to payload.onSubscriptionSavedValue.id.',
      fields: {
        id: {
          label: 'ID',
          description: 'The ID of the newly created lead.',
          type: 'string'
        },
        success: {
          label: 'Success',
          description: 'Whether or not the lead was successfully created.',
          type: 'boolean'
        }
      },
      performHook: async (request, { settings, payload }): Promise<ActionHookResponse | ActionHookError> => {
        const sf: Salesforce = new Salesforce(settings.instanceUrl, request)
        // const time = Math.floor(Date.now() / 1000) // for uniqueness of record

        let data
        try {
          data = (await sf.createRecord(payload, OBJECT_NAME)).data
        } catch (e) {
          return {
            errorMessage: (e as Error).message ?? 'Error creating lead, please retry',
            code: (e as Error).name ?? '400',
          }
        }

        return {
        successMessage: `Lead ${data.id} created successfully`,
        savedData: {
          id: data.id,
          success: data.success
          }
        }
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    if (!payload.onSubscriptionSaved?.success) {
      // just for PoC purposes
      throw new IntegrationError('MappingSetup Failed', 'MappingSetup Failed', 400)
    }

    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (payload.operation === 'create') {
      if (!payload.last_name) {
        throw new IntegrationError('Missing last_name value', 'Misconfigured required field', 400)
      }
      return await sf.createRecord(payload, OBJECT_NAME)
    }

    validateLookup(payload)

    if (payload.operation === 'update') {
      return await sf.updateRecord(payload, OBJECT_NAME)
    }

    if (payload.operation === 'upsert') {
      if (!payload.last_name) {
        throw new IntegrationError('Missing last_name value', 'Misconfigured required field', 400)
      }
      return await sf.upsertRecord(payload, OBJECT_NAME)
    }

    if (payload.operation === 'delete') {
      return await sf.deleteRecord(payload, OBJECT_NAME)
    }
  },
  performBatch: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, request)

    if (payload[0].operation === 'upsert') {
      if (!payload[0].last_name) {
        throw new IntegrationError('Missing last_name value', 'Misconfigured required field', 400)
      }
    }

    return sf.bulkHandler(payload, OBJECT_NAME)
  }
}

export default action
