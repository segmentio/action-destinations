import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_customer_taxonomy_payload } from '../utils-tax'
import { update_taxonomy } from '../utils-tax'

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
  perform: async (request, { settings, payload }) => {
    const tx_creds = {
      tx_client_key: settings.taxonomy_client_key,
      tx_client_secret: settings.taxonomy_client_secret
    }
    const taxonomy_payload = gen_customer_taxonomy_payload(settings, payload)
    return await update_taxonomy('', tx_creds, request, taxonomy_payload)
  }
}

export default action
