import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_customer_taxonomy_payload, gen_oauth1_signature } from '../utils-tax'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create top-level CUSTOMER node in Yahoo taxonomy',
  defaultSubscription: 'event = "Audience Entered" and event = "Audience Exited"',
  description: '',
  fields: {
    engage_space_id: {
      label: 'Engage Space Id',
      description:
        'Provide Engage Space Id found in Unify > Settings > API Access. This maps to the "Id" and "Name" of the top-level Customer node in Yahoo taxonomy',
      type: 'string',
      required: true
    },
    customer_desc: {
      label: 'Customer Description',
      description:
        'Provide a description for the Customer node in Yahoo taxonomy. This must be less then 1000 characters',
      type: 'string',
      required: false
    }
  },
  perform: (request, { settings, payload, auth }) => {
    // const tk = {
    //   tx_client_secret: 'abc',
    //   tx_client_key:'123'
    // }
    if (auth?.accessToken) {
      //if (tk) {
      const creds = Buffer.from(auth.accessToken, 'base64').toString()
      const creds_json = JSON.parse(creds)
      const tx_pair = creds_json.tx
      // const tx_pair = tk;
      return update_taxonomy(tx_pair, request, settings, payload)
    }
  }
}

interface CredsObj {
  tx_client_key: string
  tx_client_secret: string
}

async function update_taxonomy(tx_creds: CredsObj, request: RequestClient, settings: Settings, payload: Payload) {
  const tx_client_secret = tx_creds.tx_client_key
  const tx_client_key = tx_creds.tx_client_secret
  const url = 'https://datax.yahooapis.com/v1/taxonomy/append'
  const oauth1_auth_string = gen_oauth1_signature(tx_client_key, tx_client_secret, 'PUT', url)
  const body_form_data = gen_customer_taxonomy_payload(settings, payload)
  const add_customer_node = await request(url, {
    method: 'PUT',
    body: body_form_data,
    headers: {
      Authorization: oauth1_auth_string,
      'Content-Type': 'multipart/form-data; boundary=SEGMENT-DATA'
    }
  })
  const customer_node_json = await add_customer_node.json()
  return customer_node_json
}
export default action
