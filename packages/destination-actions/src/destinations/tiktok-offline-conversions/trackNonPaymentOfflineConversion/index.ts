import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common_fields'
import { performOfflineEvent } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: '[Deprecated] Track Non Payment Offline Conversion',
  description:
    "[Deprecated] Send a non payment related event to the TikTok Offline Conversions API. This Action has been Deprecated. Please use the 'Track Payment Offline Conversion' Action instead",
  fields: {
    ...commonFields
  },
  perform: (request, { payload, settings }) => {
    return performOfflineEvent(request, settings, payload)
  }
}

export default action
