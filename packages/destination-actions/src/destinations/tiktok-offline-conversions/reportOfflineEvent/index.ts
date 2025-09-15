import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common_fields'
import { performOfflineEvent } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Offline Conversion',
  description: 'Send details of an in-store purchase or console purchase to the Tiktok Offline Events API',
  fields: {
    ...commonFields
  },
  perform: (request, { payload, settings }) => {
    return performOfflineEvent(request, settings, payload)
  }
}

export default action
