import { RequestClient, IntegrationError } from '@segment/actions-core'
import { Payload } from './dataExtension/generated-types'

export function upsertRows(request: RequestClient, subdomain: String, payloads: Payload[]) {
  const { key, id } = payloads[0]
  //Check to make sure either key or id exists
  if (!key && !id) {
    throw new IntegrationError(
      `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`,
      'Misconfigured required field',
      400
    )
  }
  const rows: Record<string, any>[] = []
  payloads.forEach((payload: Payload) => {
    rows.push({
      keys: payload.keys,
      values: payload.values
    })
  })
  if (key) {
    return request(`https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/key:${key}/rowset`, {
      method: 'post',
      json: rows
    })
  } else {
    return request(`https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/${id}/rowset`, {
      method: 'post',
      json: rows
    })
  }
}
