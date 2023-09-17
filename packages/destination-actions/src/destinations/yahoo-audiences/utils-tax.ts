import { Payload } from './createSegment/generated-types'
import type { Settings } from './generated-types'
import { createHmac } from 'crypto'

export function gen_customer_taxonomy_payload(settings: Settings, payload: Payload) {
  const data = {
    id: payload.engage_space_id,
    name: payload.engage_space_id,
    description: payload.customer_desc,
    users: {
      include: [settings.mdm_id]
    },
    subTaxonomy: [
      {
        id: payload.segment_audience_id,
        name: payload.segment_audience_key,
        type: 'SEGMENT'
      }
    ]
  }
  const req_body_form = new FormData()
  req_body_form.append('metadata', JSON.stringify({ description: payload.customer_desc }))
  req_body_form.append('data', JSON.stringify(data))
  return req_body_form
}

export function gen_segment_subtaxonomy_payload(payload: Payload) {
  const data = {
    id: payload.segment_audience_id,
    name: payload.segment_audience_key,
    type: 'SEGMENT'
  }
  const req_body_form = new FormData()
  req_body_form.append(
    'metadata',
    JSON.stringify({
      description: `add new SEGMENT subtaxonomy node: id=${payload.segment_audience_id},name=${payload.segment_audience_key}`
    })
  )
  req_body_form.append('data', JSON.stringify(data))
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
export function gen_oauth1_signature(client_key: string, client_secret: string) {
  // Following logic in #9 https://oauth.net/core/1.0a/#sig_norm_param
  const timestamp = Math.floor(new Date().getTime() / 1000)
  const nonce = gen_random_id(15)

  const param_string = `oauth_consumer_key=${encodeURIComponent(client_key)}&oauth_nonce=${encodeURIComponent(
    nonce
  )}&oauth_signature_method=${encodeURIComponent('HMAC-SHA1')}&oauth_timestamp=${encodeURIComponent(
    timestamp
  )}&oauth_version=${encodeURIComponent('1.0')}`

  const base_string = `GET&${encodeURIComponent('https://datax.yahooapis.com/v1/taxonomy')}&${encodeURIComponent(
    param_string
  )}`
  const encoded_client_secret = encodeURIComponent(client_secret)
  const signature = encodeURIComponent(
    createHmac('sha1', encoded_client_secret + '&')
      .update(base_string)
      .digest('base64')
  )
  // const options = {
  //   method: 'GET',
  //   headers: {
  //     Authorization: `OAuth oauth_consumer_key="${client_key}", oauth_nonce="${nonce}", oauth_signature="${signature}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_version="1.0"`
  //   }
  // };
  const oauth1_auth_string = `OAuth oauth_consumer_key="${client_key}", oauth_nonce="${nonce}", oauth_signature="${signature}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_version="1.0"`
  return oauth1_auth_string
}
