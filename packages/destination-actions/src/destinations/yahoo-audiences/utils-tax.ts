import { Payload } from './createSegment/generated-types'
import type { Settings } from './generated-types'

export function gen_customer_taxonomy_payload(settings: Settings, payload: Payload) {
  const customer_tax_payload = {
    id: settings.mdm_id,
    name: 'customer_' + settings.mdm_id,
    description: 'customer_' + settings.mdm_id,
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
  return customer_tax_payload
}

export function gen_segment_subtaxonomy_payload(payload: Payload) {
  const segment_tax_payload = {
    id: payload.segment_audience_id,
    name: payload.segment_audience_key,
    type: 'SEGMENT'
  }
  return segment_tax_payload
}
