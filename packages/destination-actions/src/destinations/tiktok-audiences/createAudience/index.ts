import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createAudience } from '../functions'
import { selected_advertiser_id, custom_audience_name, id_type } from '../properties'
import { TikTokAudiences } from '../api'

// === NOTE ===
// This createAudience is independent of the native createAudience that is implemented in ../index.ts.
// Consider it deprecated and do not emulate its behavior.

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Audience (Legacy)',
  description: 'Use this action to create a new audience in TikTok Audience Segment. This is required for legacy instances of the TikTok Audience destination to create a partner audience within TikTok for syncing Engage audiences to.',
  defaultSubscription: 'event = "Create Audience"',
  fields: {
    selected_advertiser_id: { ...selected_advertiser_id },
    custom_audience_name: { ...custom_audience_name },
    id_type: { ...id_type }
  },
  dynamicFields: {
    selected_advertiser_id: async (request, { settings }) => {
      try {
        const tiktok = new TikTokAudiences(request)

        if (settings.advertiser_ids) {
          return tiktok.fetchAdvertisers(settings.advertiser_ids)
        }

        return {
          choices: [],
          error: {
            message: JSON.stringify('BAD REQUEST - expected settings.advertiser_ids and got nothing!'),
            code: '400'
          }
        }
      } catch (err) {
        return {
          choices: [],
          error: {
            message: JSON.stringify(err),
            code: '500'
          }
        }
      }
    }
  },
  perform: async (request, { payload, statsContext }) => {
    statsContext?.statsClient?.incr('createAudience.legacy', 1, statsContext?.tags)
    return createAudience(request, payload)
  }
}

export default action
