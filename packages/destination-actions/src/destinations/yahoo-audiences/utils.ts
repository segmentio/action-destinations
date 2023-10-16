import { RequestClient } from '@segment/actions-core'

import { gen_oauth1_signature } from './utils-tax'
import { CredsObj } from './types'

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

export async function update_taxonomy(
  engage_space_id: string,
  tx_creds: CredsObj,
  request: RequestClient,
  body_form_data: string
) {
  const tx_client_secret = tx_creds.tx_client_key
  const tx_client_key = tx_creds.tx_client_secret
  const url = `https://datax.yahooapis.com/v1/taxonomy/append${engage_space_id.length > 0 ? '/' + engage_space_id : ''}`
  const oauth1_auth_string = gen_oauth1_signature(tx_client_key, tx_client_secret, 'PUT', url)

  const add_segment_node = await request(url, {
    method: 'PUT',
    body: body_form_data,
    headers: {
      Authorization: oauth1_auth_string,
      'Content-Type': 'multipart/form-data; boundary=SEGMENT-DATA'
    }
  })

  return await add_segment_node.json()
}
