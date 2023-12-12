import type { ActionDefinition } from '@segment/actions-core'

import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { handleUpdate } from '../shared'

import { enable_batching, external_audience_id, google_gid, mobile_advertising_id, anonymous_id } from '../properties'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Add to Audience',
  description: 'Add a user to a Display & Video 360 audience.',
  fields: {
    enable_batching: { ...enable_batching },
    external_audience_id: { ...external_audience_id },
    anonymous_id: { ...anonymous_id },
    mobile_advertising_id: { ...mobile_advertising_id },
    google_gid: { ...google_gid }
  },
  perform: async (request, { payload, statsContext }) => {
    statsContext?.statsClient?.incr('addToAudience', 1, statsContext?.tags)
    await handleUpdate(request, [payload], 'add', statsContext)
    return { success: true }
  },
  performBatch: async (request, { payload, statsContext }) => {
    statsContext?.statsClient?.incr('addToAudience.batch', 1, statsContext?.tags)
    await handleUpdate(request, payload, 'add', statsContext)
    return { success: true }
  }
}

export default action
