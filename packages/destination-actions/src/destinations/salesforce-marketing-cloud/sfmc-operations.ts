import { RequestClient, IntegrationError } from '@segment/actions-core'
import { Payload as payload_dataExtension } from './dataExtension/generated-types'
import { Payload as payload_contactDataExtension } from './contactDataExtension/generated-types'
import { createClientAsync, Client } from 'soap'
import { Settings } from './generated-types'

const SUBDOMAIN = `segment4.my.salesforce.com`
const WSDL_URL = `https://${SUBDOMAIN}.soap.marketingcloudapis.com/etframework.wsdl`

interface RefreshTokenResponse {
  access_token: string
  soap_instance_url: string
}

export async function createClient(): Promise<Client> {
  return createClientAsync(WSDL_URL)
}

export async function getAccessToken(request: RequestClient, settings: Settings): Promise<{access_token: string, soap_instance_url: string}> {
  const baseUrl = `https://${settings.subdomain}.auth.marketingcloudapis.com/v2/token`
  const res = await request<RefreshTokenResponse>(`${baseUrl}`, {
    method: 'POST',
    body: new URLSearchParams({
      account_id: settings.account_id,
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'client_credentials'
    })
  })

  console.log('oauth res', res)
  return { access_token: res.data.access_token as string, soap_instance_url: res.data.soap_instance_url as string }
}

export function upsertRows(
  request: RequestClient,
  subdomain: String,
  payloads: payload_dataExtension[] | payload_contactDataExtension[]
) {
  const { key, id } = payloads[0]
  if (!key && !id) {
    throw new IntegrationError(
      `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`,
      'Misconfigured required field',
      400
    )
  }
  const rows: Record<string, any>[] = []
  payloads.forEach((payload: payload_dataExtension | payload_contactDataExtension) => {
    rows.push({
      keys: payload.keys,
      values: payload.values
    })
  })
  if (key) {
    return request(`https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/key:${key}/rowset`, {
      method: 'POST',
      json: rows
    })
  } else {
    return request(`https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/${id}/rowset`, {
      method: 'POST',
      json: rows
    })
  }
}
