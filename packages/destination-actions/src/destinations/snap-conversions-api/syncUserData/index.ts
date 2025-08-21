import { ActionDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import snap_capi_input_fields_v3 from '../reportConversionEvent/snap-capi-input-fields-v3'
import { performSnapCAPIv3 as perform, performSnapCAPIv3Batch as performBatch } from '../reportConversionEvent/snap-capi-v3'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync User Data',
  description:
    'Synchronize user data without tracking events to Snapchat Conversions API. Used for updating user profiles and enhancing audience data for better ad targeting.',
  defaultSubscription: 'type = "identify"',
  fields: snap_capi_input_fields_v3,
  perform,
  performBatch,
  default: {
    event_name: { '@literal': 'UPDATE_PROFILE' },
    action_source: { '@literal': 'website' },
    event_time: { '@path': '$.timestamp' },
    event_id: { '@path': '$.messageId' },
    ...defaultValues(snap_capi_input_fields_v3)
  }
}

export default action