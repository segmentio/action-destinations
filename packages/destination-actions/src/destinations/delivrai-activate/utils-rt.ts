import { createHash } from 'crypto'
import { Payload } from './updateSegment/generated-types'
import { DelivrAIPayload } from './types'
import type {  RequestClient } from '@segment/actions-core'
import {DELIVRAI_BASE_URL , DELIVRAI_GET_TOKEN} from './constants';


/**
 * Creates a SHA256 hash from the input
 * @param input The input string
 * @returns The SHA256 hash (string), or undefined if the input is undefined.
 */
export function create_hash(input: string | undefined): string | undefined {
  if (input === undefined) return
  return createHash('sha256').update(input).digest('hex')
}

/**
 * Generates JWT for Realtime API authentication
 * @param client_id
 * @param client_secret
 * @returns The JWT token
 */
export async function generate_jwt(client_identifier: string ,request: RequestClient,) {
  const url = `${DELIVRAI_BASE_URL}${DELIVRAI_GET_TOKEN}?client_identifier=${client_identifier}`

  return await request(url, {
      method: 'GET'
    })
}

/**
 * Gets the definition to send the hashed email, phone or advertising ID.
 * @param payload The payload.
 * @returns {{ maid: boolean; email: boolean }} The definitions object (id_schema).
 */

// export function validate_phone(phone: string) {
//   /*
//   Phone must match E.164 format: a number up to 15 digits in length starting with a ‘+’
//   - remove any non-numerical characters
//   - check length
//   - if phone doesn't match the criteria - drop the value, otherwise - return the value prepended with a '+'
//   */
//   const phone_num = phone.replace(/\D/g, '')
//   if (phone_num.length <= 15 && phone_num.length >= 1) {
//     return '+' + phone_num
//   } else {
//     return ''
//   }
// }

/**
 * The ID schema defines whether the payload should contain the
 * hashed advertising ID for iOS or Android, or the hashed email.
 * @param payloads
 * @returns {DelivrAIPayload} The Delivr AI payload.
 */
export function gen_update_segment_payload(payloads: Payload[]  , client_identifier_id:string): DelivrAIPayload {
  const data_groups: {
    [hashed_email: string]: {
      exp: string
      seg_id: string
      ts: string
    }[]
  } = {}
  const data = []
  //
  let audience_key = '';
  for (const event of payloads) {
    let hashed_email: string | undefined = ''
    if (event.email) {
      hashed_email = create_hash(event.email.toLowerCase())
    }
    // let idfa: string | undefined = ''
    // let gpsaid: string | undefined = ''
    // if (event.advertising_id) {
    //   if (event.device_type) {
    //     switch (event.device_type) {
    //       case 'ios':
    //         idfa = event.advertising_id
    //         break
    //       case 'android':
    //         gpsaid = event.advertising_id
    //         break
    //     }
    //   } else {
    //     if (event.advertising_id === event.advertising_id.toUpperCase()) {
    //       // Apple IDFA is always uppercase
    //       idfa = event.advertising_id
    //     } else {
    //       gpsaid = event.advertising_id
    //     }
    //   }
    // }
    // let hashed_phone: string | undefined = ''
    // if (event.phone) {
    //   const phone = validate_phone(event.phone)
    //   if (phone !== '') {
    //     hashed_phone = create_hash(phone)
    //   }
    // }
    if (hashed_email === '' ) {
      continue
    }
    const ts = Math.floor(new Date().getTime() / 1000)
    //const seg_key = event.segment_audience_key
    let exp
    // When a user enters an audience - set expiration ts to now() + 90 days
    // if (event.event_attributes[seg_key] === true) {
    //   exp = ts + 90 * 24 * 60 * 60
    // }
    // When a user exits an audience - set expiration ts to 0
    // if (event.event_attributes[seg_key] === false) {
    //   exp = 0
    // }

    const seg_id = event.segment_audience_id
    audience_key = seg_id;
    const group_key = `${hashed_email}`
    if (!(group_key in data_groups)) {
      data_groups[group_key] = []
    }

    data_groups[group_key].push({
      exp: String(exp),
      seg_id: seg_id,
      ts: String(ts)
    })
  }
  
  for (const [key] of Object.entries(data_groups)) {
    const [hashed_email] = key.split('|');
  //  let action_string = '';
    // for (const values of grouped_values) {
    //   action_string +=  values.seg_id;
    // }
 
  //  action_string = action_string.slice(0, -1)
    data.push(hashed_email)
  }

  // const gdpr_flag = payloads[0].gdpr_settings ? payloads[0].gdpr_settings.gdpr_flag : false
 // schema: ['SHA256EMAIL', 'IDFA', 'GPADVID', 'HASHEDID', 'SEGMENTS'],
  const delivr_ai_payload: DelivrAIPayload = {
    audience_key : audience_key,
    data: data,
    client_identifier_id:client_identifier_id
  }


  // if (gdpr_flag) {
  //   delivr_ai_payload.gdpr_euconsent = payloads[0].gdpr_settings?.gdpr_euconsent
  // }

  return delivr_ai_payload
}
