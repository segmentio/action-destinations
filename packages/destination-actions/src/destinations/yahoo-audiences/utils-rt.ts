import { createHmac } from 'crypto'
import { createHash } from 'crypto'
import { Payload } from './updateSegment/generated-types'
import { IntegrationError } from '@segment/actions-core'

export function gen_random_id(length = 24): string {
  const pattern = 'abcdefghijklmnopqrstuvwxyz123456789'
  const result = []
  for (let i = 0; i < length; i++) {
    result.push(pattern[Math.floor(Math.random() * pattern.length)])
  }
  return result.join('')
}

export function create_hash(input: string | undefined) {
  if (input === undefined) return
  const hash = createHash('sha256')
  hash.update(input)
  return hash.digest('hex')
}

// Generate JWT for Realtime API authentication
export function generate_jwt(client_id: string, client_secret: string) {
  const random_id = gen_random_id()
  const current_time = Math.floor(new Date().getTime() / 1000)

  const jwt_header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const jwt_payload = {
    iss: client_id,
    sub: client_id,
    aud: 'https://id.b2b.yahooinc.com/identity/oauth2/access_token',
    jti: 'id-' + random_id,
    exp: current_time + 3600,
    iat: current_time
  }

  const jwt_header_encoded = Buffer.from(JSON.stringify(jwt_header)).toString('base64url')
  const jwt_payload_encoded = Buffer.from(JSON.stringify(jwt_payload)).toString('base64url')
  const hash = createHmac('sha256', client_secret)
  const signature = hash.update(jwt_header_encoded + '.' + jwt_payload_encoded).digest('hex')
  const jwt = jwt_header_encoded + '.' + jwt_payload_encoded + '.' + signature

  return jwt
}

export function get_id_schema(payload: Payload) {
  const schema = {
    maid: false,
    email: false
  }
  if (payload.send_advertising_id === true) {
    schema.maid = true
  }
  if (payload.send_email === true) {
    schema.email = true
  }

  return schema
}

export function check_schema(payload: Payload): void {
  if (payload.send_email === false && payload.send_advertising_id === false) {
    throw new IntegrationError(
      'Either `Send Email`, or `Send Advertising ID` setting must be set to `true`.',
      'INVALID_SETTINGS',
      400
    )
  }
}

export function gen_update_segment_payload(payloads: Payload[]) {
  check_schema(payloads[0])
  const schema = get_id_schema(payloads[0])

  /* 
  Ouput schema
  {
    Schema: [
        "EMAIL","IDFA", "GPSAID", "SEGMENTS"
    ],
    Data: [
        ["user_1_sha_email", "","", "exp=current_unix_ts+90_days&seg_id=audience_1a_id&ts=current_unix_ts"],         // add User 1 into Segment 'audience_1a'
        ["user_1_sha_email", "","", "exp=0&seg_id=audience_1b_id&ts=current_unix_ts"]                                // remove User 1 from Segment 'audience_1b'
        ["", "user_2_idfa", "", "exp=current_unix_ts+90_days&seg_id=audience_2a_id&ts=current_unix_ts"],             // add User 2 into Segment 'audience_2a'
        ["", "user_3_idfa", "user_4_gpsaid", "exp=current_unix_ts+90_days&seg_id=audience_2b_id&ts=current_unix_ts"] // add User 3 into Segment 'audience_2b'
    ],
    gdpr: true,
    gdpr_euconsent: "storage and access of information and personalisation"
  }
  */

  const data = []
  let exp
  for (const event of payloads) {
    let hashed_email: string | undefined = ''
    if (schema.email === true) {
      hashed_email = create_hash(event.email)
    }
    let hashed_idfa: string | undefined = ''
    if (schema.maid === true && event.device_type === 'ios') {
      hashed_idfa = create_hash(event.advertising_id)
    }
    let hashed_gpsaid: string | undefined = ''
    if (schema.maid === true && event.device_type === 'android') {
      hashed_gpsaid = create_hash(event.advertising_id)
    }

    const ts = Math.floor(new Date().getTime() / 1000)
    if (event.event_name == 'Audience Entered') {
      exp = ts + 90 * 24 * 60 * 60
    }
    if (event.event_name == 'Audience Exited') {
      exp = 0
    }
    const seg_id = event.segment_audience_id
    data.push([hashed_email, hashed_idfa, hashed_gpsaid, 'exp=' + exp + '&seg_id=' + seg_id, +'&ts=' + ts])
  }

  const yahoo_payload = {
    Schema: ['EMAIL', 'IDFA', 'GPSAID', 'SEGMENTS'],
    Data: data,
    gdpr: false // at this point we set GDPR = false
  }
  return yahoo_payload
}
