import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { id_type, custom_audience_name, selected_advertiser_id } from '../properties'
import { TikTokAudiences } from '../api'
import { createAudience } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Audience',
  description: 'Creates a TikTok Audience Segment.',
  fields: {
    custom_audience_name: { ...custom_audience_name },
    selected_advertiser_id: { ...selected_advertiser_id },
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
  perform: (request, { payload }) => {
    return createAudience(request, payload)
  }
}

export default action
