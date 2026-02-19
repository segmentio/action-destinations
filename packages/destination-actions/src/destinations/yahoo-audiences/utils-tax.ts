import type { Settings } from './generated-types'
import { createHmac } from 'crypto'
import { CredsObj, YahooSubTaxonomy } from './types'
import { RequestClient, IntegrationError, ModifiedResponse } from '@segment/actions-core'
import { StatsClient } from '@segment/actions-core/destination-kit'

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

export function generate_taxonomy_jwt(client_id: string, client_secret: string): string {
  const random_id = gen_random_id(24)
  const current_time = Math.floor(new Date().getTime() / 1000)
  const url = 'https://id.b2b.yahooincapis.com/zts/v1'
  const jwt_payload = {
    iss: client_id,
    sub: client_id,
    aud: url,
    jti: random_id,
    exp: current_time + 3600,
    iat: current_time
  }
  const jwt_header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const jwt_header_encoded = Buffer.from(JSON.stringify(jwt_header)).toString('base64')
  const jwt_payload_encoded = Buffer.from(JSON.stringify(jwt_payload)).toString('base64')
  const jwt_head_payload = jwt_header_encoded + '.' + jwt_payload_encoded

  const hash = createHmac('sha256', client_secret)
  const signature = hash.update(jwt_head_payload).digest('base64')
  const jwt = jwt_head_payload + '.' + signature

  return jwt
}

export async function get_taxonomy_access_token(
  client_id: string,
  client_secret: string,
  request: RequestClient
): Promise<string> {
  const jwt = generate_taxonomy_jwt(client_id, client_secret)

  const tokenResponse: ModifiedResponse<{
    access_token: string
    token_type: string
    expires_in: number
  }> = await request('https://id.b2b.yahooincapis.com/zts/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: jwt,
      scope: 'idb2b.dsp.datax:role.batch.writer'
    })
  })

  const access_token = tokenResponse.data.access_token

  return access_token
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
  body_form_data: string,
  statsClient: StatsClient | undefined,
  statsTags: string[] | undefined
) {
  const tx_client_secret = tx_creds.tx_client_secret
  const tx_client_key = tx_creds.tx_client_key
  const url = `https://datax.yahooapis.com/v1/taxonomy/append${engage_space_id.length > 0 ? '/' + engage_space_id : ''}`

  try {
    const access_token = await get_taxonomy_access_token(tx_client_key, tx_client_secret, request)
    const add_segment_node = await request(url, {
      method: 'PUT',
      body: body_form_data,
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'multipart/form-data; boundary=SEGMENT-DATA'
      }
    })
    if (statsClient && statsTags) {
      statsClient.incr('update_taxonomy.success', 1, statsTags)
    }
    return await add_segment_node.json()
  } catch (error) {
    const _error = error as { response: { data: unknown; status: string } }
    if (statsClient && statsTags) {
      statsClient.incr('update_taxonomy.error', 1, statsTags)
    }
    // If Taxonomy API returned 401, throw Integration error w/status 400 to prevent refreshAccessToken from firing
    // Otherwise throw the original error
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
