import { Payload as SegmentNodePayload } from './createSegment/generated-types'
import { Payload as CustomerNodePayload } from './createCustomerNode/generated-types'
import type { Settings } from './generated-types'
import { createHmac } from 'crypto'

export function gen_customer_taxonomy_payload(settings: Settings, payload: CustomerNodePayload) {
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

export function gen_segment_subtaxonomy_payload(payload: SegmentNodePayload) {
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
