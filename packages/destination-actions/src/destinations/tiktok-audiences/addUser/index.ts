import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { processPayload } from '../functions'
import {
  selected_advertiser_id,
  audience_id,
  email,
  advertising_id,
  send_email,
  send_advertising_id,
  event_name,
  enable_batching
} from '../properties'
import { TikTokAudiences } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Users',
  description: 'Add contacts from an Engage Audience to a TikTok Audience Segment.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    selected_advertiser_id: { ...selected_advertiser_id },
    audience_id: { ...audience_id },
    email: { ...email },
    advertising_id: { ...advertising_id },
    send_email: { ...send_email },
    send_advertising_id: { ...send_advertising_id },
    event_name: { ...event_name },
    enable_batching: { ...enable_batching }
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
    },
    audience_id: async (request, { payload }) => {
      try {
        const tiktok = new TikTokAudiences(request)

        return await tiktok.fetchAudiences(payload.selected_advertiser_id)
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
  perform: async (request, { settings, payload, statsContext }) => {
    statsContext?.statsClient?.incr('actions-tiktok-audiences.addUser', 1, statsContext?.tags)
    return processPayload(request, settings, [payload], 'add')
  },
  performBatch: async (request, { settings, payload, statsContext }) => {
    statsContext?.statsClient?.incr('actions-tiktok-audiences.addUser', 1, statsContext?.tags)
    return processPayload(request, settings, payload, 'add')
  }
}

export default action
