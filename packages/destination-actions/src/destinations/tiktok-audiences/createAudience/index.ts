import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createAudience } from '../functions'
import { selected_advertiser_id, custom_audience_name, id_type } from '../properties'
import { TikTokAudiences } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Audience',
  description: 'Creates a new audience in TikTok Audience Segment.',
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

        return tiktok.fetchAdvertisers(settings.advertiser_ids)
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
  perform: async (request, { payload }) => {
    return createAudience(request, payload)
  }
}

export default action
