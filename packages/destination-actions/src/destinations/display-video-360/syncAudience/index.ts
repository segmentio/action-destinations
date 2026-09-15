import type { ActionDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { syncAudience } from '../shared'

import {
  enable_batching,
  external_audience_id,
  google_gid,
  mobile_advertising_id,
  partner_provided_id
} from '../properties'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync Audience [Beta]',
  description: 'Sync users to a Display & Video 360 audience. This action is currently in beta.',
  defaultSubscription: 'type = "track"',
  fields: {
    enable_batching: { ...enable_batching },
    external_audience_id: { ...external_audience_id },
    mobile_advertising_id: { ...mobile_advertising_id },
    google_gid: { ...google_gid },
    partner_provided_id: { ...partner_provided_id }
  },
  perform: async (request, { payload, statsContext, audienceMembership }) => {
    statsContext?.tags?.push('slug:actions-display-video-360')
    statsContext?.statsClient?.incr('syncAudience.perform', 1, statsContext?.tags)
    await syncAudience(request, [payload], statsContext, [audienceMembership])
    return { success: true }
  },
  performBatch: async (request, { payload, statsContext, audienceMembership }) => {
    statsContext?.tags?.push('slug:actions-display-video-360')
    statsContext?.statsClient?.incr('syncAudience.performBatch', 1, statsContext?.tags)
    await syncAudience(request, payload, statsContext, audienceMembership)
    return { success: true }
  }
}

export default action
