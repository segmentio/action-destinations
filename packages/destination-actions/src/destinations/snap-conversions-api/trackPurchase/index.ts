import { ActionDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import snap_capi_input_fields_v3 from '../reportConversionEvent/snap-capi-input-fields-v3'
import { performSnapCAPIv3 as perform, performSnapCAPIv3Batch as performBatch } from '../reportConversionEvent/snap-capi-v3'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Purchase',
  description:
    'Track purchase/conversion events with enhanced ecommerce data to Snapchat Conversions API. Optimized for Order Completed events with detailed product and transaction information.',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: snap_capi_input_fields_v3,
  perform,
  performBatch,
  default: {
    event_name: { '@literal': 'PURCHASE' },
    action_source: { '@literal': 'website' },
    event_time: { '@path': '$.timestamp' },
    event_id: { '@path': '$.messageId' },
    ...defaultValues(snap_capi_input_fields_v3)
  }
}

export default action