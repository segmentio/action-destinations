import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common_fields'
import { performOfflineEvent } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: '[Deprecated] Track Payment Offline Conversion',
  description:
    "[Deprecated] Send details of an in-store purchase or console purchase to the Tiktok Offline Events API. This Action has been Deprecated. Please use the 'Track Payment Offline Conversion' Action instead",
  fields: {
    ...commonFields
  },
  perform: (request, { payload, settings }) => {
    return performOfflineEvent(request, settings, payload)
  }
}

export default action
