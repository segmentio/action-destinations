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
    const client = await createClientAsync(
      'packages/destination-actions/src/destinations/salesforce-marketing-cloud/salesforce-soap-wsdl.xml'
    )

    const { access_token, soap_instance_url } = await getAccessToken(request, settings)

    client.addSoapHeader({
      fueloauth: access_token
    })

    client.setEndpoint(soap_instance_url)

    return client
  },
  hooks: {
    onMappingSave: {
      label: 'Example soapclient usage',
      description:
        'This hook demonstrates usage of the soap client. It connects to SFMC and sends a single get request.',
      inputFields: {},
      outputTypes: {},
      performHook: async (_request, _, soapClient) => {
        if (!soapClient) {
          throw new Error('Soap client not initialized')
        }

        await soapClient.describeAllTabs(
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
