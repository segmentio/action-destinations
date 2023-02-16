import type { ActionDefinition } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import { TikTokAudiences } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validate, getAllAudiences, getAudienceID, extractUsers } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Users from Audience',
  description: 'Sync contacts from an Engage Audience to a TikTok Audience Segment.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    selected_advertiser_id: {
      label: 'Advertiser ID',
      description: 'The advertiser ID to use when syncing audiences.',
      type: 'string',
      dynamic: true,
      required: true
    },
    custom_audience_name: {
      label: 'Custom Audience Name',
      description:
        'Custom audience name of audience to be created. Please note that names over 70 characters will be truncated to 67 characters with "..." appended. This field is set only when Segment creates a new audience. Updating this field after Segment has created an audience will not update the audience name in TikTok.',
      type: 'string',
      default: {
        '@path': '$.properties.audience_key'
      }
    },
    id_type: {
      label: 'ID Type',
      description: 'Encryption type to be used for populating the audience.',
      type: 'string',
      choices: [
        { label: 'Email', value: 'EMAIL_SHA256' },
        { label: 'Google Advertising ID', value: 'GAID_SHA256' }
      ]
    },
    email: {
      label: 'User Email',
      description: "The user's email address to send to LinkedIn.",
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.traits.email' in Personas events.
      default: {
        '@path': '$.context.traits.email'
      }
    },
    google_advertising_id: {
      label: 'User Google Advertising ID',
      description: "The user's Google Advertising ID to send to LinkedIn.",
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.device.advertisingId' in Personas events.
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    event_name: {
      label: 'Event Name',
      description: 'The name of the current Segment event.',
      type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.event' in Personas events.
      default: {
        '@path': '$.event'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to the TikTok Audiences.',
      type: 'boolean',
      default: true
    },
    personas_audience_key: {
      label: 'Segment Engage Audience Key',
      description:
        'The `audience_key` of the Engage audience you want to sync to TikTok. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.',
      type: 'string'
    }
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
    return processPayload(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return processPayload(request, settings, payload)
  }
}

async function processPayload(request: RequestClient, settings: Settings, payloads: Payload[]) {
  validate(payloads)
  const TikTokApiClient: TikTokAudiences = new TikTokAudiences(request, 'placeholder')

  const audiences = await getAllAudiences(TikTokApiClient)

  const audience_id = await getAudienceID(TikTokApiClient, payloads[0], audiences)

  const users = extractUsers(payloads, audience_id)

  let res
  if (users.length > 0) {
    const elements = {
      advertiser_ids: [settings.advertiser_ids],
      action: 'delete',
      data: users
    }
    res = await TikTokApiClient.batchUpdate(elements)
  }

  return res
}

export default action
