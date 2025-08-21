import { ActionDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import snap_capi_input_fields_v3 from '../reportConversionEvent/snap-capi-input-fields-v3'
import { performSnapCAPIv3 as perform, performSnapCAPIv3Batch as performBatch } from '../reportConversionEvent/snap-capi-v3'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track App Event',
  description:
    'Track app-specific events to Snapchat Conversions API. Designed for mobile app conversion tracking with enhanced app data and device information.',
  defaultSubscription: 'type = "track" and context.device.type != null',
  fields: snap_capi_input_fields_v3,
  perform,
  performBatch,
  default: {
    action_source: { '@literal': 'app' },
    event_time: { '@path': '$.timestamp' },
    event_id: { '@path': '$.messageId' },
    ...defaultValues(snap_capi_input_fields_v3)
  }
}

export default action