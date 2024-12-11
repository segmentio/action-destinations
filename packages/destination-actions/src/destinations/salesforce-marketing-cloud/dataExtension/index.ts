import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { key, id, keys, enable_batching, batch_size, values_dataExtensionFields } from '../sfmc-properties'
import { upsertRows, getAccessToken } from '../sfmc-operations'
import { Client, createClientAsync } from 'soap'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event to Data Extension',
  description: 'Upsert events as rows into an existing data extension in Salesforce Marketing Cloud.',
  soapAPIConfiguration: async (request, settings): Promise<Client> => {
    console.log('Creating client sfmc')
    const client = await createClientAsync(
      'packages/destination-actions/src/destinations/salesforce-marketing-cloud/salesforce-soap-wsdl.xml'
    )
    console.log('describe', client.describe())

    console.log('settings', settings)
    const { access_token, soap_instance_url } = await getAccessToken(request, settings)

    console.log('soap_instance_url', soap_instance_url)
    console.log('accessToken', access_token)
    client.addSoapHeader({
      fueloauth: access_token
    })

    client.setEndpoint(soap_instance_url)

    return client
  },
  hooks: {
    onMappingSave: {
      label: 'Create Data Extension',
      description: 'Create a new data extension in Salesforce Marketing Cloud.',
      inputFields: {
        operation: {
          label: 'Create a new data extension',
          description: 'Create a new data extension in Salesforce Marketing Cloud.',
          type: 'boolean'
        },
        dataExtensionName: {
          label: 'Data Extension Name',
          description: 'The name of the data extension to create.',
          type: 'string',
          required: true
        },
        dataExtensionShape: {
          label: 'Columns to create',
          description: 'The columns to create in the data extension.',
          type: 'object',
          additionalProperties: false,
          multiple: true,
          defaultObjectUI: 'arrayeditor',
          properties: {
            retlColumnName: {
              label: 'RETL Column Name',
              type: 'string',
              required: true
            },
            dataExtensionColumnName: {
              label: 'Data Extension Column Name',
              type: 'string',
              required: true
            },
            type: {
              label: 'Type',
              type: 'string',
              required: true,
              choices: [
                { label: 'Text', value: 'text' },
                { label: 'Number', value: 'number' },
                { label: 'Date', value: 'date' },
                { label: 'Boolean', value: 'boolean' }
              ]
            }
          }
        }
      },
      outputTypes: {},
      performHook: async (_request, _, soapClient) => {
        if (!soapClient) {
          throw new Error('Soap client not initialized')
        }

        const res = soapClient.describeAllTabs(
          {},
          function (err: string, result: string) {
            if (err) {
              console.error(err)
            } else {
              console.log(result)
            }
          },
          { method: 'get' }
        )

        console.log('res', res)

        return {
          successMessage: 'success'
        }
      }
    }
  },
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
  performBatch: async (request, { settings, payload }) => {
    return upsertRows(request, settings.subdomain, payload)
  }
}

export default action
