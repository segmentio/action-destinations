import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import snap_capi_input_fields_v2 from './snap-capi-input-fields-v2'
import { performSnapCAPIv3 as perform } from './snap-capi-v3'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Conversion Event',
  description:
    'Report events directly to Snapchat. Data shared can power Snap solutions such as custom audience targeting, campaign optimization, Dynamic Ads, and more.',
  fields: snap_capi_input_fields_v2,
  perform
}

export default action
