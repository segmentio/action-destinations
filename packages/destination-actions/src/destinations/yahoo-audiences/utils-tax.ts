import type { Settings } from './generated-types'
import type { ModifiedResponse } from '@segment/actions-core'
import { CredsObj, YahooSubTaxonomy, TokenResponse } from './types'
import { RequestClient, IntegrationError } from '@segment/actions-core'
import { StatsClient, Logger } from '@segment/actions-core/destination-kit'
import { generate_jwt } from './utils-rt'

// Constants for Yahoo Taxonomy API
import { YAHOO_AUDIENCES_TAXONOMY_API_VERSION } from './versioning-info'
const TAXONOMY_CLIENT_KEY_PREFIX = 'idb2b.dsp.datax'
const TAXONOMY_TOKEN_ENDPOINT = `https://id.b2b.yahooincapis.com/zts/${YAHOO_AUDIENCES_TAXONOMY_API_VERSION}/oauth2/token`
const TAXONOMY_AUDIENCE_URL = `https://id.b2b.yahooincapis.com/zts/${YAHOO_AUDIENCES_TAXONOMY_API_VERSION}`
const TAXONOMY_SCOPE = 'idb2b.dsp.datax:role.online.writer'

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

/**
 * Obtains a short-lived OAuth 2.0 Bearer token for the Taxonomy API using the
 * same JWT client-credentials flow used by the Online (Realtime) API.
 * @param request RequestClient for making HTTP requests
 * @param tx_client_key Taxonomy API client key (will be prefixed with 'idb2b.dsp.datax.')
 * @param tx_client_secret Taxonomy API client secret
 * @returns OAuth 2.0 access token
 */
export async function get_taxonomy_access_token(
  request: RequestClient,
  tx_client_key: string,
  tx_client_secret: string
): Promise<string> {
  // Prefix the client key as required by Yahoo's Taxonomy API
  const prefixed_client_key = `${TAXONOMY_CLIENT_KEY_PREFIX}.${tx_client_key}`

  // Generate JWT using the shared utility
  const jwt = generate_jwt(prefixed_client_key, tx_client_secret)

  const res: ModifiedResponse<TokenResponse> = await request<TokenResponse>(TAXONOMY_TOKEN_ENDPOINT, {
    method: 'POST',
    body: new URLSearchParams({
      client_assertion: jwt,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      grant_type: 'client_credentials',
      scope: TAXONOMY_SCOPE,
      aud: TAXONOMY_AUDIENCE_URL
    })
  })

  if (!res?.data?.access_token) {
    throw new IntegrationError(
      'Failed to obtain taxonomy access token - missing access_token in response',
      'YAHOO_TAXONOMY_TOKEN_ERROR',
      500
    )
  }

  return res.data.access_token
}

export async function update_taxonomy(
  engage_space_id: string,
  tx_creds: CredsObj,
  request: RequestClient,
  body_form_data: string,
  statsClient: StatsClient | undefined,
  statsTags: string[] | undefined,
  logger?: Logger
) {
  const tx_client_secret = tx_creds.tx_client_secret
  const tx_client_key = tx_creds.tx_client_key
  const url = `https://datax.yahooapis.com/${YAHOO_AUDIENCES_TAXONOMY_API_VERSION}/taxonomy/append${
    engage_space_id.length > 0 ? '/' + engage_space_id : ''
  }`

  logger?.info(
    '[update_taxonomy] Starting taxonomy update request',
    `engage_space_id: ${engage_space_id}`,
    `url: ${url}`,
    `tx_client_key: ${tx_client_key ? 'present' : 'missing'}`
  )

  // Get a short-lived Bearer token using the same JWT client-credentials flow as the Online API
  const access_token = await get_taxonomy_access_token(request, tx_client_key, tx_client_secret)

  logger?.info('[update_taxonomy] Access token obtained successfully')

  try {
    logger?.info('[update_taxonomy] Sending PUT request to Yahoo Taxonomy API', `url: ${url}`)

    const add_segment_node = await request(url, {
      method: 'PUT',
      body: body_form_data,
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'multipart/form-data; boundary=SEGMENT-DATA'
      }
    })

    logger?.info(
      '[update_taxonomy] Received response from Yahoo Taxonomy API',
      `status: ${add_segment_node.status}`,
      `statusText: ${add_segment_node.statusText}`
    )

    if (statsClient && statsTags) {
      statsClient.incr('update_taxonomy.success', 1, statsTags)
    }

    const responseData = await add_segment_node.json()

    logger?.info(
      '[update_taxonomy] Response data from Yahoo Taxonomy API',
      `responseData: ${JSON.stringify(responseData)}`
    )

    return responseData
  } catch (error) {
    const _error = error as { response: { data: unknown; status: string } }

    logger?.warn(
      '[update_taxonomy] Error occurred during taxonomy update',
      `status: ${_error.response?.status || 'unknown'}`,
      `responseData: ${JSON.stringify(_error.response?.data || {})}`
    )

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
