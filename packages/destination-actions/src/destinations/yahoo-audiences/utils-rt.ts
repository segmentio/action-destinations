import { createHmac, createHash } from 'crypto'

import { IntegrationError } from '@segment/actions-core'
import { Payload } from './updateSegment/generated-types'

/**
 * Generates a random ID
 * @param length The ID length. The default is 24.
 * @returns A generated random ID (string)
 */
export function gen_random_id(length: number): string {
  const pattern = 'abcdefghijklmnopqrstuvwxyz123456789'
  const result = []
  for (let i = 0; i < length; i++) {
    result.push(pattern[Math.floor(Math.random() * pattern.length)])
  }
  return result.join('')
}

/**
 * Creates a SHA256 hash from the input
 * @param input The input string
 * @returns The SHA256 hash
 */
export function create_hash(input: string | undefined) {
  if (input === undefined) return
  return createHash('sha256').update(input).digest('hex')
}

/**
 * Generates JWT for Realtime API authentication
 * @param client_id
 * @param client_secret
 * @returns The JWT token
 */
export function generate_jwt(client_id: string, client_secret: string) {
  const random_id = gen_random_id(24)
  const current_time = Math.floor(new Date().getTime() / 1000)
  const url = 'https://id.b2b.yahooinc.com/identity/oauth2/access_token'
  const jwt_payload = {
    iss: client_id,
    sub: client_id,
    aud: url + '?realm=dataxonline',
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

/**
 * Gets the definition to send the hashed email or hashed advertising ID.
 * @param payload The payload.
 * @returns The definitions object (id_schema).
 */
export function get_id_schema(payload: Payload) {
  return {
    maid: payload.send_advertising_id === true,
    email: payload.send_email === true
  }
}

/**
 * Validates the payload schema.
 * If both `Send Email` and `Send Advertising ID` are set to `false`, an error is thrown.
 * @param payload The payload.
 */
export function check_schema(payload: Payload): void {
  console.log(payload)
  if (payload.send_email === false && payload.send_advertising_id === false) {
    console.log('INVALID_SETTINGS error: Either `Send Email`, or `Send Advertising ID` setting must be set to `true`.')
    throw new IntegrationError(
      'Either `Send Email`, or `Send Advertising ID` setting must be set to `true`.',
      'INVALID_SETTINGS',
      400
    )
  }
}

/**
 * The ID schema defines whether the payload should contain the
 * hashed advertising ID for iOS or Android, or the hashed email.
 * @param payloads
 * @returns
 */
export function gen_update_segment_payload(payloads: Payload[]) {
  console.log('payloads:', payloads)
  check_schema(payloads[0])
  const schema = get_id_schema(payloads[0])
  // TODO: sort payloads by userId and group segments per user
  const data = []
  let exp
  for (const event of payloads) {
    let hashed_email: string | undefined = ''
    if (schema.email === true) {
      hashed_email = create_hash(event.email)
    }
    let hashed_idfa: string | undefined = ''
    let hashed_gpsaid: string | undefined = ''
    if (schema.maid === true) {
      switch (event.device_type) {
        case 'ios':
          hashed_idfa = create_hash(event.advertising_id)
          break
        case 'android':
          hashed_gpsaid = create_hash(event.advertising_id)
          break
      }
    }
    if (schema.maid === true && event.device_type === 'android') {
      hashed_gpsaid = create_hash(event.advertising_id)
    }

    const ts = Math.floor(new Date().getTime() / 1000)
    console.log('ts:', ts)
    const seg_key = event.segment_audience_key
    // When a users enters an audience - set expiration ts to now() + 90 days
    if (event.event_name == 'Audience Entered' || event.event_attributes[seg_key] == true) {
      exp = ts + 90 * 24 * 60 * 60
    }
    // When a users enters an audience - set expiration ts to 0
    if (event.event_name == 'Audience Exited' || event.event_attributes[seg_key] == false) {
      exp = 0
    }

    const seg_id = event.segment_audience_id
    data.push([hashed_email, hashed_idfa, hashed_gpsaid, 'exp=' + exp + '&seg_id=' + seg_id + '&ts=' + ts])
  }

  const yahoo_payload: YahooPayload = {
    Schema: ['SHA256EMAIL', 'IDFA', 'GPSAID', 'SEGMENTS'],
    Data: data,
    gdpr: payloads[0].gdpr_flag
  }

  if (payloads[0].gdpr_flag) {
    yahoo_payload.gdpr_euconsent = payloads[0].gdpr_euconsent
  }
  return yahoo_payload
}
interface YahooPayload {
  Schema: Array<string>
  Data: Array<unknown>
  gdpr: boolean
  gdpr_euconsent?: string | undefined
}
