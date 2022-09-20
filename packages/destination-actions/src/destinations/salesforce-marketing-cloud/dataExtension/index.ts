import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { key, id, keys, values } from '../sfmc-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event to Data Extension',
  description: 'Upsert events as rows into an existing data extension in Salesforce Marketing Cloud.',
  fields: {
    key: key,
    id: id,
    keys: { ...keys, required: true },
    values: values
  },
  perform: (request, { settings, payload }) => {
    //Check to make sure either key or id is being passed
    if (!payload.key && !payload.id) {
      throw new IntegrationError(
        `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`,
        'Misconfigured required field',
        400
      )
    }
    if (payload.key) {
      return request(
        `https://${settings.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/key:${payload.key}/rowset`,
        {
          method: 'post',
          json: [
            {
              keys: payload.keys,
              values: payload.values
            }
          ]
        }
      )
    } else {
      return request(
        `https://${settings.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/${payload.id}/rowset`,
        {
          method: 'post',
          json: [
            {
              keys: payload.keys,
              values: payload.values
            }
          ]
        }
      )
    }
  }

  // performBatch: async (request, { settings, payload }) => {
  //   const { key, id } = payload[0]
  //   if (key) {
  //     return request(`https://${settings.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/key:${key}/rowset`, {
  //       method: 'post',
  //       json: [payload]
  //     })
  //   }
  //   else {
  //     return request(`https://${settings.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/${id}/rowset`, {
  //       method: 'post',
  //       json: [payload]
  //     })
  //   }

  // }
}

export default action
