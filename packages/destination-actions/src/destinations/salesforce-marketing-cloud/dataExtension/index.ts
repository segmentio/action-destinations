import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { key, id, keys, enable_batching, batch_size, values_dataExtensionFields } from '../sfmc-properties'
import { upsertRows } from '../sfmc-operations'
import { createClientAsync } from 'soap'

interface WSDL_REQUEST {
  wsdl: string
}
const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event to Data Extension',
  description: 'Upsert events as rows into an existing data extension in Salesforce Marketing Cloud.',
  soapAPIConfiguration: async (): Promise<string> => {
    console.log('Creating client sfmc')
    const client = await createClientAsync('packages/destination-actions/src/destinations/salesforce-marketing-cloud/salesforce-soap-wsdl.xml')
    console.log('describe', client.describe())

    return 'Client created'
  },
  hooks: {
    onMappingSave: {
      label: 'Create Data Extension',
      description: 'Create a new data extension in Salesforce Marketing Cloud.',
      inputFields: {
        operation: {
          label: 'Create a new data extension',
          description: 'Create a new data extension in Salesforce Marketing Cloud.',
          type: 'boolean',
        },
        dataExtensionName: {
          label: 'Data Extension Name',
          description: 'The name of the data extension to create.',
          type: 'string',
          required: true,
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
              required: true,
            },
            dataExtensionColumnName: {
              label: 'Data Extension Column Name',
              type: 'string',
              required: true,
            },
            type: {
              label: 'Type',
              type: 'string',
              required: true,
              choices: [
                { label: 'Text', value: 'text' },
                { label: 'Number', value: 'number' },
                { label: 'Date', value: 'date' },
                { label: 'Boolean', value: 'boolean' },
              ],
            }
          }
        }
      },
      outputTypes: {},
      performHook: async (request) => {
        // const soapClient = createClient()
        // console.log(soapClient)

        // // The following is psuedo code

        // // const columns = dataExtensionShape.map((column) => {
        // //   return {
        // //     name: column.name,
        // //     type: column.type,
        // //   }
        // // }) 

        // // const res = await request(${url}, {
        // //   method: 'POST',
        // //   json: {
        // //     name: dataExtensionName,
        // //     columns,
        // //   }
        // // })

        // return {
        // }
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
  perform: async (request, { settings, payload, hookInputs }) => {
    return upsertRows(request, settings.subdomain, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return upsertRows(request, settings.subdomain, payload)
  }
}

export default action
