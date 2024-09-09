import type { ActionDefinition, ExecuteInput, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { customFields, operation } from '../sf-properties'
import { generateSalesforceRequest } from '../sf-operations'
import { SalesforceV61 } from './sf-classes'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Object by External Id',
  description:
    'Create, update, or upsert records in any custom or standard object in Salesforce, using its External ID.',
  fields: {
    operation: operation,
    customObjectName: {
      label: 'Salesforce Object',
      description:
        'The API name of the Salesforce object that records will be added or updated within. This can be a standard or custom object. Custom objects must be predefined in your Salesforce account and should end with "__c".',
      type: 'string',
      required: true,
      dynamic: true
    },
    externalIdField: {
      label: 'External ID Field',
      description: 'The name of the field that will be used as the External ID.',
      type: 'string',
      required: true
    },
    externalIdValue: {
      label: 'External Id Value',
      description: 'The external id field value that will be used to update the record.',
      type: 'string',
      required: true
    },
    customFields: customFields
  },
  dynamicFields: {
    customObjectName: async (request: RequestClient, data: ExecuteInput<Settings, Payload, any, any, any>) => {
      const salesforceInstance: SalesforceV61 = new SalesforceV61(
        data.settings.instanceUrl,
        await generateSalesforceRequest(data.settings, request)
      )

      return salesforceInstance.customObjectName()
    }
  },
  perform: async (request, { settings, payload }) => {
    const salesforceInstance: SalesforceV61 = new SalesforceV61(
      settings.instanceUrl,
      await generateSalesforceRequest(settings, request)
    )
    console.log(request, payload, salesforceInstance)
    return await salesforceInstance.upsertRecord(payload, payload.customObjectName)
  }
}

export default action
