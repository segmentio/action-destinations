import { Payload as SegmentNodePayload } from './createSegment/generated-types'
import { Payload as CustomerNodePayload } from './createCustomerNode/generated-types'
import type { Settings } from './generated-types'
import { createHmac } from 'crypto'
import { gen_random_id } from './utils'

/**
 * For Yahoo Ads, a Taxonomy is the equivalent of a Segment Space.
 * @param settings {Settings} The destination settings.
 * @param payload {CustomerNodePayload} The payload from the Segment Space settings.
 * @returns {String} The formatted Taxonomy payload.
 */
export function gen_customer_taxonomy_payload(settings: Settings, payload: CustomerNodePayload): string {
  const data = {
    id: payload.engage_space_id,
    name: payload.engage_space_id,
    description: payload.customer_desc,
    users: {
      include: [settings.mdm_id]
    }
  }

  // Form data must be delimited with CRLF = /r/n: RFC https://www.rfc-editor.org/rfc/rfc7578#section-4.1
  const req_body_form = `--SEGMENT-DATA\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json;charset=UTF-8\r\n\r\n{ "description" : "${
    payload.customer_desc
  }" }\r\n--SEGMENT-DATA\r\nContent-Disposition: form-data; name="data"\r\nContent-Type: application/json;charset=UTF-8\r\n\r\n${JSON.stringify(
    data
  )}\r\n--SEGMENT-DATA--`
  return req_body_form
}

/**
 * For Yahoo Ads, a Subtaxonomy is the equivalent of a Segment Audience.
 * @param payload {SegmentNodePayload} The payload from the Segment Audience.
 * @returns {String} The formatted Subtaxonomy payload.
 */
export function gen_segment_subtaxonomy_payload(payload: SegmentNodePayload): string {
  const data = {
    id: payload.segment_audience_id,
    name: payload.segment_audience_key,
    type: 'SEGMENT'
  }
  const req_body_form = `--SEGMENT-DATA\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json;charset=UTF-8\r\n\r\n{ "description" : "${
    payload.customer_desc
  }" }\r\n--SEGMENT-DATA\r\nContent-Disposition: form-data; name="data"\r\nContent-Type: application/json;charset=UTF-8\r\n\r\n${JSON.stringify(
    data
  )}\r\n--SEGMENT-DATA--`
  return req_body_form
}

/**
 * One of Yahoo API endpoints require OAuth1 authentication.
 * @param client_key Provided by Yahoo.
 * @param client_secret Provided by Yahoo.
 * @param method The method.
 * @param url The base URL.
 * @returns {String} The OAuth1 signature.
 */
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
