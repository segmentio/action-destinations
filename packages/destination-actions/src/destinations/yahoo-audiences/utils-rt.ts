import { createHmac } from 'crypto'
import { Payload } from './updateSegment/generated-types'
import { YahooPayload } from './types'
import { gen_random_id } from './utils-tax'
import { processHashing } from '../../lib/hashing-utils'

/**
 * Creates a SHA256 hash from the input
 * @param input The input string
 * @returns The SHA256 hash (string), or undefined if the input is undefined.
 */
export function create_hash(input: string | undefined): string | undefined {
  if (input === undefined) return
  return processHashing(input, 'sha256', 'hex', (value: string) => value.toLowerCase())
}

/**
 * Generates JWT for Realtime API authentication
 * @param client_id
 * @param client_secret
 * @returns The JWT token
 */
export function generate_jwt(client_id: string, client_secret: string): string {
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
 * Gets the definition to send the hashed email, phone or advertising ID.
 * @param payload The payload.
 * @returns {{ maid: boolean; email: boolean }} The definitions object (id_schema).
 */

export function validate_phone(phone: string) {
  /*
  Phone must match E.164 format: a number up to 15 digits in length starting with a ‘+’
  - remove any non-numerical characters
  - check length
  - if phone doesn't match the criteria - drop the value, otherwise - return the value prepended with a '+'
  */
  const phone_num = phone.replace(/\D/g, '')
  if (phone_num.length <= 15 && phone_num.length >= 1) {
    return '+' + phone_num
  } else {
    return ''
  }
}

/**
 * The ID schema defines whether the payload should contain the
 * hashed advertising ID for iOS or Android, or the hashed email.
 * @param payloads
 * @returns {YahooPayload} The Yahoo payload.
 */
export function gen_update_segment_payload(payloads: Payload[]): YahooPayload {
  const data_groups: {
    [hashed_email: string]: {
      exp: string
      seg_id: string
      ts: string
    }[]
  } = {}
  const data = []
  //
  for (const event of payloads) {
    let hashed_email: string | undefined = ''
    if (event.email) {
      hashed_email = create_hash(event.email.toLowerCase())
    }
    let idfa: string | undefined = ''
    let gpsaid: string | undefined = ''
    if (event.advertising_id) {
      if (event.device_type) {
        switch (event.device_type) {
          case 'ios':
            idfa = event.advertising_id
            break
          case 'android':
            gpsaid = event.advertising_id
            break
        }
      } else {
        if (event.advertising_id === event.advertising_id.toUpperCase()) {
          // Apple IDFA is always uppercase
          idfa = event.advertising_id
        } else {
          gpsaid = event.advertising_id
        }
      }
    }
    let hashed_phone: string | undefined = ''
    if (event.phone) {
      const phone = validate_phone(event.phone)
      if (phone !== '') {
        hashed_phone = create_hash(phone)
      }
    }
    if (hashed_email === '' && idfa === '' && gpsaid === '' && hashed_phone === '') {
      continue
    }
    const ts = Math.floor(new Date().getTime() / 1000)
    const seg_key = event.segment_audience_key
    let exp
    // When a user enters an audience - set expiration ts to now() + 90 days
    if (event.event_attributes[seg_key] === true) {
      exp = ts + 90 * 24 * 60 * 60
    }
    // When a user exits an audience - set expiration ts to 0
    if (event.event_attributes[seg_key] === false) {
      exp = 0
    }

    const seg_id = event.segment_audience_id

    const group_key = `${hashed_email}|${idfa}|${gpsaid}|${hashed_phone}`
    if (!(group_key in data_groups)) {
      data_groups[group_key] = []
    }

    data_groups[group_key].push({
      exp: String(exp),
      seg_id: seg_id,
      ts: String(ts)
    })
  }

  for (const [key, grouped_values] of Object.entries(data_groups)) {
    const [hashed_email, idfa, gpsaid, hashed_phone] = key.split('|')
    let action_string = ''
    for (const values of grouped_values) {
      action_string += 'exp=' + values.exp + '&seg_id=' + values.seg_id + '&ts=' + values.ts + ';'
    }

    action_string = action_string.slice(0, -1)
    data.push([hashed_email, idfa, gpsaid, hashed_phone, action_string])
  }

  const gdpr_flag = payloads[0].gdpr_settings ? payloads[0].gdpr_settings.gdpr_flag : false

  const yahoo_payload: YahooPayload = {
    schema: ['SHA256EMAIL', 'IDFA', 'GPADVID', 'HASHEDID', 'SEGMENTS'],
    data: data,
    gdpr: gdpr_flag
  }

  if (gdpr_flag) {
    yahoo_payload.gdpr_euconsent = payloads[0].gdpr_settings?.gdpr_euconsent
  }

  return yahoo_payload
}
