import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_segment_subtaxonomy_payload } from '../utils-tax'
import { update_taxonomy } from '../utils'
/* Generates a Segment in Yahoo Taxonomy */

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create SEGMENT sub-node in Yahoo taxonomy',
  description: 'Use this action to generate SEGMENT sub-node within CUSTOMER node in Yahoo taxonomy',
  defaultSubscription: 'event = "Audience Entered" and event = "Audience Exited"',

  fields: {
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Provide audience key. This maps to the "Name" of the Segment node in Yahoo taxonomy',
      type: 'string',
      required: true
    },
    segment_audience_id: {
      label: 'Audience Id',
      description:
        'Provide audience Id (aud_...) from audience URL in Segment Engage. This maps to the "Id" of the Segment node in Yahoo taxonomy',
      type: 'string',
      required: true
    },
    engage_space_id: {
      label: 'Engage Space Id',
      description:
        'Provide Engage Space Id found in Unify > Settings > API Access. This maps to the "Id" and "Name" of the top-level Customer node in Yahoo taxonomy and specifies the parent node for your Segment node in Yahoo taxonomy',
      type: 'string',
      required: false
    },
    customer_desc: {
      label: 'Space Description',
      description: 'Provide the description for Segment node in Yahoo taxonomy. This must be less then 1000 characters',
      type: 'string',
      required: false
    }
  },
  perform: async (request, { payload, auth }) => {
    if (auth?.accessToken) {
      const creds = Buffer.from(auth.accessToken, 'base64').toString()
      const creds_json = JSON.parse(creds)
      const tx_pair = creds_json.tx
      const body_form_data = gen_segment_subtaxonomy_payload(payload)
      return await update_taxonomy(String(payload.engage_space_id), tx_pair, request, body_form_data)
    }
  }
}

export default action
