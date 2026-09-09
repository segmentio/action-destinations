import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import snap_capi_input_fields_v3 from '../reportConversionEvent/snap-capi-input-fields-v3'
import { performSnapCAPIv3 as perform } from '../reportConversionEvent/snap-capi-v3'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track App Event',
  description:
    'Track app-specific events to Snapchat Conversions API. Designed for mobile app conversion tracking with enhanced app data and device information.',
  defaultSubscription: 'type = "track" and context.device.type != null',
  fields: snap_capi_input_fields_v3,
  perform
}

export default action