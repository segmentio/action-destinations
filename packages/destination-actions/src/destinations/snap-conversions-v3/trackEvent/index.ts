import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import snap_capi_input_fields_v3 from '../reportConversionEvent/snap-capi-input-fields-v3'
import { performSnapCAPIv3 as perform } from '../reportConversionEvent/snap-capi-v3'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description:
    'Track standard conversion events to Snapchat Conversions API. Automatically maps Segment track events to appropriate Snapchat event types for conversion tracking and optimization.',
  defaultSubscription: 'type = "track"',
  fields: snap_capi_input_fields_v3,
  perform
}

export default action