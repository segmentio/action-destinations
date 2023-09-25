import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_customer_taxonomy_payload } from '../utils-tax'
import { update_taxonomy } from '../utils'

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
      const taxonomy_payload = gen_customer_taxonomy_payload(settings, payload)
      return update_taxonomy('', tx_pair, request, taxonomy_payload)
    }
  }
}

export default action
