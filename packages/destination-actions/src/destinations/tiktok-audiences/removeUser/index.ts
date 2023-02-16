import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { processPayload } from '../functions'
import {
  custom_audience_name,
  id_type,
  email,
  phone,
  advertising_id,
  event_name,
  enable_batching,
  personas_audience_key
} from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Users',
  description: 'Remove contacts from an Engage Audience to a TikTok Audience Segment.',
  defaultSubscription: 'event = "Audience Exited"',
  fields: {
    selected_advertiser_id: {
      label: 'Advertiser ID',
      description: 'The advertiser ID to use when syncing audiences.',
      type: 'string',
      dynamic: true,
      required: true
    },
    custom_audience_name: { ...custom_audience_name },
    id_type: { ...id_type },
    email: { ...email },
    phone: { ...phone },
    advertising_id: { ...advertising_id },
    event_name: { ...event_name },
    enable_batching: { ...enable_batching },
    personas_audience_key: { ...personas_audience_key }
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
  perform: async (request, { settings, payload }) => {
    return processPayload(request, settings, [payload], 'delete')
  },
  performBatch: async (request, { settings, payload }) => {
    return processPayload(request, settings, payload, 'delete')
  }
}

export default action
