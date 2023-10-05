import type { Settings } from './generated-types'
import { createHmac } from 'crypto'
import { CredsObj, YahooSubTaxonomy } from './types'
import { RequestClient, IntegrationError } from '@segment/actions-core'

export function gen_customer_taxonomy_payload(settings: Settings) {
  const data = {
    id: settings.engage_space_id,
    name: settings.engage_space_id,
    description: settings.customer_desc,
    users: {
      include: [settings.mdm_id]
    }
  }
  // Form data must be delimited with CRLF = /r/n: RFC https://www.rfc-editor.org/rfc/rfc7578#section-4.1
  const req_body_form = `--SEGMENT-DATA\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json;charset=UTF-8\r\n\r\n{ "description" : "${
    settings.customer_desc
  }" }\r\n--SEGMENT-DATA\r\nContent-Disposition: form-data; name="data"\r\nContent-Type: application/json;charset=UTF-8\r\n\r\n${JSON.stringify(
    data
  )}\r\n--SEGMENT-DATA--`
  return req_body_form
}

export function gen_segment_subtaxonomy_payload(payload: YahooSubTaxonomy) {
  const data = {
    id: payload.segment_audience_id,
    name: payload.segment_audience_key,
    type: 'SEGMENT'
  }
  const req_body_form = `--SEGMENT-DATA\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json;charset=UTF-8\r\n\r\n{ "description" : "Create segment ${
    data.id
  }" }\r\n--SEGMENT-DATA\r\nContent-Disposition: form-data; name="data"\r\nContent-Type: application/json;charset=UTF-8\r\n\r\n${JSON.stringify(
    data
  )}\r\n--SEGMENT-DATA--`
  return req_body_form
}

export function gen_random_id(length: number): string {
  const pattern = 'abcdefghijklmnopqrstuvwxyz123456789'
  const random_id: string[] = []
  for (let i = 0; i < length; i++) {
    random_id.push(pattern[Math.floor(Math.random() * pattern.length)])
  }
  return random_id.join('')
}

export function gen_oauth1_signature(client_key: string, client_secret: string, method: string, url: string) {
  // Following logic in #9 https://oauth.net/core/1.0a/#sig_norm_param
  const timestamp = Math.floor(new Date().getTime() / 1000)
  const nonce = gen_random_id(15)

  const param_string = `oauth_consumer_key=${encodeURIComponent(client_key)}&oauth_nonce=${encodeURIComponent(
    nonce
  )}&oauth_signature_method=${encodeURIComponent('HMAC-SHA1')}&oauth_timestamp=${encodeURIComponent(
    timestamp
  )}&oauth_version=${encodeURIComponent('1.0')}`

  const base_string = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(param_string)}`
  const encoded_client_secret = encodeURIComponent(client_secret)
  const signature = encodeURIComponent(
    createHmac('sha1', encoded_client_secret + '&')
      .update(base_string)
      .digest('base64')
  )
  const oauth1_auth_string = `OAuth oauth_consumer_key="${client_key}", oauth_nonce="${nonce}", oauth_signature="${signature}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_version="1.0"`
  return oauth1_auth_string
}

export async function update_taxonomy(
  engage_space_id: string,
  tx_creds: CredsObj,
  request: RequestClient,
  body_form_data: string
) {
  const tx_client_secret = tx_creds.tx_client_secret
  const tx_client_key = tx_creds.tx_client_key
  const url = `https://datax.yahooapis.com/v1/taxonomy/append${engage_space_id.length > 0 ? '/' + engage_space_id : ''}`
  const oauth1_auth_string = gen_oauth1_signature(tx_client_key, tx_client_secret, 'PUT', url)
  try {
    const add_segment_node = await request(url, {
      method: 'PUT',
      body: body_form_data,
      headers: {
        Authorization: oauth1_auth_string,
        'Content-Type': 'multipart/form-data; boundary=SEGMENT-DATA'
      }
    })
    return await add_segment_node.json()
  } catch (error) {
    const _error = error as { response: { data: unknown; status: string } }
    // If Taxonomy API returned 401, throw Integration error w/status 400 to prevent refreshAccessToken from firing
    // Otherwise throw the orifinal error
    if (parseInt(_error.response.status) == 401) {
      throw new IntegrationError(
        `Error while updating taxonomy: ${JSON.stringify(_error.response.data)} ${
          _error.response.status
        }. Validate Yahoo credentials`,
        'YAHOO_TAXONOMY_API_AUTH_ERR',
        400
      )
    } else {
      throw error
    }
  }
}
